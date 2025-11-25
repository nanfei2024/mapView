<template>
  <div class="plate-list">
    <h4>板块数据展示与操作</h4>
    <div class="level-actions">
      <button @click="loadGeoJsonByLevel(1)">加载一级板块</button>
      <button @click="loadGeoJsonByLevel(2)">加载二级板块</button>
      <button @click="loadGeoJsonByLevel(3)">加载三级板块</button>
      <button @click="loadAllLevels">批量加载全部</button>
      <button @click="removeExistingLayers">清空所有板块</button>
    </div>
    <div class="list-status" v-if="statusMsg">{{ statusMsg }}</div>
    
    <!-- 二级板块列表 -->
    <div v-if="level2Plates.length > 0" class="plate-details-section">
      <h5>📍 二级板块列表 ({{ level2Plates.length }}个)</h5>
      <div class="plate-items-container">
        <div v-for="(plate, index) in level2Plates" :key="index" class="plate-detail-item">
          <div class="plate-detail-header">
            <span class="plate-name">{{ plate.properties?.name || '未知板块' }}</span>
            <span class="plate-code">代码: {{ plate.properties?.code || 'N/A' }}</span>
          </div>
          <div class="plate-chapter-info">
            <span class="chapter-label">📖 关联章节:</span>
            <span class="chapter-value">{{ plate.properties?.chapter || '暂无关联' }}</span>
          </div>
          <div class="plate-meta">
            <span>📏 面积: {{ plate.properties?.area || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 三级板块列表 -->
    <div v-if="level3Plates.length > 0" class="plate-details-section">
      <h5>📍 三级板块列表 ({{ level3Plates.length }}个)</h5>
      <div class="plate-items-container">
        <div v-for="(plate, index) in level3Plates" :key="index" class="plate-detail-item">
          <div class="plate-detail-header">
            <span class="plate-name">{{ plate.properties?.name || '未知板块' }}</span>
            <span class="plate-code">代码: {{ plate.properties?.code || 'N/A' }}</span>
          </div>
          <div class="plate-chapter-info">
            <span class="chapter-label">📖 关联章节:</span>
            <span class="chapter-value">{{ plate.properties?.chapter || '暂无关联' }}</span>
          </div>
          <div class="plate-meta">
            <span>📏 面积: {{ plate.properties?.area || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { plateRegionApi } from '../api/plateRegionApi';
const props = defineProps<{ map: any }>();
const statusMsg = ref('');
const level2Plates = ref<any[]>([]);
const level3Plates = ref<any[]>([]);

function getColorByLevel(level: number) {
  return { 1: '#ff0000', 2: '#00ff00', 3: '#0000ff' }[level] || '#888888';
}

async function loadGeoJsonByLevel(level: number) {
  statusMsg.value = `正在加载${level}级板块...`;
  try {
    if (!props.map || !props.map.isStyleLoaded()) {
      statusMsg.value = '地图未加载完成';
      return;
    }
    const res = await plateRegionApi.getGeoJsonByLevel(level);
    // 兼容后端返回FeatureCollection或data字段
    const geoJson = res.type === 'FeatureCollection' ? res : res.data;
    if (!geoJson || !geoJson.features || geoJson.features.length === 0) {
      statusMsg.value = `${level}级板块暂无数据`;
      return;
    }
    
    // 保存二级和三级板块数据用于显示列表
    if (level === 2) {
      level2Plates.value = geoJson.features;
    } else if (level === 3) {
      level3Plates.value = geoJson.features;
    }
    
    removeExistingLayers(level);
    try {
      props.map.addSource(`regions-level-${level}`, { type: 'geojson', data: geoJson });
    } catch (e) {
      statusMsg.value = `添加数据源失败: ${e}`;
      return;
    }
    try {
      props.map.addLayer({
        id: `regions-fill-${level}`,
        type: 'fill',
        source: `regions-level-${level}`,
        paint: {
          'fill-color': getColorByLevel(level),
          'fill-opacity': 0.6
        }
      });
    } catch (e) {
      statusMsg.value = `添加填充图层失败: ${e}`;
      return;
    }
    try {
      props.map.addLayer({
        id: `regions-border-${level}`,
        type: 'line',
        source: `regions-level-${level}`,
        paint: {
          'line-color': getColorByLevel(level),
          'line-width': 2
        }
      });
    } catch (e) {
      statusMsg.value = `添加边框图层失败: ${e}`;
      return;
    }
    props.map.on('click', `regions-fill-${level}`, (e: any) => {
      if (e.features.length > 0) {
        const p = e.features[0].properties;
        new window.mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<h3>${p.name}</h3><p>级别: ${p.level}</p><p>代码: ${p.code}</p><p>面积: ${p.area}</p>`)
          .addTo(props.map);
      }
    });
    props.map.on('mouseenter', `regions-fill-${level}`, () => {
      props.map.getCanvas().style.cursor = 'pointer';
    });
    props.map.on('mouseleave', `regions-fill-${level}`, () => {
      props.map.getCanvas().style.cursor = '';
    });
    statusMsg.value = `${level}级板块加载成功，共${geoJson.features.length}个区域`;
  } catch (e: any) {
    statusMsg.value = `加载${level}级板块失败：${e.message}` + (e.detail ? `，${e.detail}` : '');
  }
}

function removeExistingLayers(level?: number) {
  if (!props.map) return;
  const layers = props.map.getStyle().layers;
  if (!layers) return;
  layers.forEach((layer: any) => {
    if (layer.id.startsWith('regions-')) {
      try { props.map.removeLayer(layer.id); } catch (e) { }
    }
  });
  const sources = props.map.getStyle().sources;
  Object.keys(sources).forEach(sourceId => {
    if (sourceId.startsWith('regions-level-')) {
      try { props.map.removeSource(sourceId); } catch (e) { }
    }
  });
}

async function loadAllLevels() {
  for (let level = 1; level <= 3; level++) {
    await loadGeoJsonByLevel(level);
  }
}
</script>
<style scoped>
.plate-list { 
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
.plate-list h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(64, 158, 255, 0.3);
}
.level-actions { 
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.level-actions button { 
  flex: 1;
  min-width: 140px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}
.level-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
}
.level-actions button:active {
  transform: translateY(0);
}
.level-actions button:nth-child(4) {
  background: linear-gradient(135deg, #67c23a 0%, #52a832 100%);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}
.level-actions button:nth-child(4):hover {
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.5);
}
.level-actions button:nth-child(5) {
  background: linear-gradient(135deg, #f56c6c 0%, #e84545 100%);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}
.level-actions button:nth-child(5):hover {
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.5);
}
.list-status { 
  color: #67c23a; 
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(103, 194, 58, 0.1);
  border-left: 4px solid #67c23a;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
}
/* 板块详情列表样式 */
.plate-details-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid rgba(64, 158, 255, 0.3);
}
.plate-details-section h5 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}
.plate-items-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}
.plate-items-container::-webkit-scrollbar {
  width: 6px;
}
.plate-items-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.plate-items-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.plate-items-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
.plate-detail-item {
  background: rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
}
.plate-detail-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}
.plate-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.plate-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  flex: 1;
  min-width: 150px;
}
.plate-code {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 6px;
}
.plate-chapter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 6px;
  flex-wrap: wrap;
}
.chapter-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}
.chapter-value {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
  flex: 1;
}
.plate-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.plate-meta span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 6px;
}
</style> 