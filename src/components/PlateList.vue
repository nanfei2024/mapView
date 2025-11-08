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
    <div class="list-status">{{ statusMsg }}</div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { plateRegionApi } from '../api/plateRegionApi';
const props = defineProps<{ map: any }>();
const statusMsg = ref('');

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
.plate-list { padding: 12px; }
.level-actions button { margin-right: 8px; margin-bottom: 8px; }
.list-status { color: #b0bec5; margin-top: 12px; }
</style> 