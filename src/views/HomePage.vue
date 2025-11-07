<template>
  <div class="map-container" :class="{ 'split-mode': showBookViewer }">
    <!-- 地图容器 -->
    <MapVisualization v-if="showMap" 
      :activeLayers="activeLayers"
      @toggle-layer="toggleLayer"
      @add-layer="addLayer"
      @remove-layer="removeLayer"
      @clear-all-layers="clearAllLayers"
      @change-basemap="changeBasemap"
      @basemap-loaded="handleBasemapLoaded"
      :currentBasemap="currentBasemap"
      ref="mapRef"
      @book-viewer-change="handleBookViewerChange"
    />

    <!-- 右侧控制面板 -->
    <div class="control-panel" :class="{ 'control-panel-with-viewer': showBookViewer }">
      <h3>功能控制</h3>
      <div class="control-buttons">
        <div class="control-btn" @click="toggleFileUpload">
          <span class="btn-icon">📤</span>
          <span class="btn-text">文件上传</span>
        </div>
        <div class="control-btn" @click="toggleFilePagination">
          <span class="btn-icon">📋</span>
          <span class="btn-text">文件列表</span>
        </div>
        <div class="control-btn" @click="toggleMeasurePanel">
          <span class="btn-icon">📏</span>
          <span class="btn-text">测量</span>
          <!-- 测量工具面板 -->
          <div class="measure-panel" v-show="showMeasurePanel">
            <div class="measure-btn" @click.stop="handleMeasure('reset')">
              <span class="measure-icon">🌍</span>
              <span>重置视图</span>
            </div>
            <div class="measure-btn" @click.stop="handleMeasure('distance')">
              <span class="measure-icon">📏</span>
              <span>测距</span>
            </div>
            <div class="measure-btn" @click.stop="handleMeasure('area')">
              <span class="measure-icon">⬢</span>
              <span>测面</span>
            </div>
            <div class="measure-btn" @click.stop="handleMeasure('clear')">
              <span class="measure-icon">🗑️</span>
              <span>清除</span>
            </div>
          </div>
        </div>
        <div class="control-btn" @click="toggleMapDataPanel">
          <span class="btn-icon">📊</span>
          <span class="btn-text">底图数据</span>
        </div>
        <div class="control-btn" @click="navigateToBooks">
          <span class="btn-icon">📚</span>
          <span class="btn-text">书籍查看</span>
        </div>
      </div>

      <!-- 显示的组件 -->
      <div class="panel-content" v-if="showAnyComponent">
        <FileUpload v-if="showFileUpload" />
        <FilePagination v-if="showFilePagination" />
      </div>
    </div>
    
    <!-- 专题底图数据面板 -->
    <div id="controls" 
      v-show="showMapDataPanel" 
      :class="{ 
        'controls-visible': showMapDataPanel,
        'controls-with-viewer': showBookViewer 
      }"
    >
      <h3>专题底图数据</h3>
      <!-- 添加清除按钮 -->
      <div class="clear-button-container">
        <button class="clear-button" @click="clearAllLayers" :disabled="!activeLayers.length">
          <span class="clear-icon">🗑️</span>
          <span>清除所有图层</span>
        </button>
      </div>
      
      <!-- 专题图层列表 -->
      <ul>
        <li v-for="(group, index) in layerGroups" :key="index">
          <div @click="toggleGroup(index)" class="group-title">
            <strong>{{ group.title }}</strong>
            <span>{{ group.expanded ? "-" : "+" }}</span>
          </div>
          <ul v-show="group.expanded" class="layer-list">
            <li v-for="layer in group.layers" :key="layer.name">
              <input
                type="checkbox"
                :value="layer.name"
                v-model="activeLayers"
                @change="handleLayerChange(layer)"
              />
              <label>{{ layer.name }}</label>
            </li>
          </ul>
        </li>
      </ul>
    </div>
    
    <!-- 底图选择可视化窗口 - 右下角 -->
    <div class="basemap-switcher">
      <div class="basemap-toggle" @click="toggleBasemapSelector">
        <span class="toggle-icon">🗺️</span>
        <span class="toggle-text">底图切换</span>
      </div>
      
      <div class="basemap-selector" v-show="showBasemapSelector">
        <div class="basemap-options">
          <div 
            v-for="map in basemaps.slice(0, 4)" 
            :key="map.id"
            class="basemap-option"
            :class="{ active: currentBasemap === map.id, loading: isBasemapLoading && currentBasemap === map.id }"
            @click="changeBasemap(map.id)"
            :data-name="map.name"
          >
            <div class="option-preview" :class="map.id"></div>
            <div class="loading-indicator" v-if="isBasemapLoading && currentBasemap === map.id">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import FileUpload from '../components/FileUpload.vue';
import FilePagination from '../components/FilePagination.vue';
import MapVisualization from '../components/MapVisualization.vue';

// 定义图层接口
interface Layer {
  name: string;
  url: string;
  type: string;
  layerName?: string;
}

// 定义底图接口
interface Basemap {
  id: string;
  name: string;
  style: string;
}

// 定义图层组接口
interface LayerGroup {
  title: string;
  expanded: boolean;
  layers: Layer[];
}

// 定义组件的 props 和 emits
const props = withDefaults(defineProps<{
  activeLayers?: string[];
  currentBasemap?: string;
}>(), {
  activeLayers: () => [],
  currentBasemap: 'streets'
});

const emit = defineEmits<{
  (e: 'toggle-layer', layer: Layer): void;
  (e: 'add-layer', layer: Layer): void;
  (e: 'remove-layer', layerName: string): void;
  (e: 'clear-all-layers'): void;
  (e: 'change-basemap', mapId: string): void;
}>();

const showFileUpload = ref(false);
const showFilePagination = ref(false);
const showMap = ref(true);
const showMapDataPanel = ref(false);
const showBookViewer = ref(false);
const mapRef = ref<InstanceType<typeof MapVisualization> | null>(null);

// 添加底图相关状态
const showBasemapList = ref(false);
const showBasemapSelector = ref(false);
const currentBasemap = ref('streets');
const activeLayers = ref<string[]>([]);

// 添加底图加载状态
const isBasemapLoading = ref(false);

// 图层分组配置
const layerGroups = ref<LayerGroup[]>([
  {
    title: "专题地图数据",
    expanded: false,
    layers: [
      {
        name: "亚洲陆地",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:Asian land",
      },
      {
        name: "亚洲海洋",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:AsianOceanpolygon",
      },
      {
        name: "三角洲",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:Asiandelta",
      },
      {
        name: "亚洲气候与地貌",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:AsianClimateAndLandforms",
      },
      {
        name: "亚洲气候水文",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:AsianClimateWater",
      },
      {
        name: "亚洲气候线",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:AsianClimateLine",
      },
      {
        name: "亚洲气候多边形",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:AsianClimatePolygon",
      },
      {
        name: "主板块",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:MainPlates",
      },
      {
        name: "亚板块",
        url: "http://172.21.252.158:8181/geoserver/geoData/ows",
        type: "WFS",
        layerName: "geoData:SubPlates",
      },
      {
        name: "全球活动构造板块及其边界带数据集(2022年)",
        url: "http://172.21.252.158:8181/geoserver/geoData/wms?service=WMS&version=1.1.0&request=GetMap&layers=geoData%3Aplates&bbox=-181.8000030517578%2C-90.89899444580078%2C181.8000030517578%2C90.89999389648438&width=768&height=383&srs=EPSG%3A4326&styles=&format=image%2Fpng",
        type: "WMS",
      },
      {
        name: "全球板块边界及其类型数据集(2022年)",
        url: "http://172.21.252.158:8181/geoserver/geoData/wms?service=WMS&version=1.1.0&request=GetMap&layers=geoData%3Aboundaries&bbox=-179.99900817871094%2C-65.93688201904297%2C180.0%2C87.02627563476562&width=768&height=330&srs=EPSG%3A4326&styles=&format=image%2Fpng",
        type: "WMS",
      },
      {
        name: "全球海洋大陆地壳边界数据集(2022年)",
        url: "http://172.21.252.158:8181/geoserver/geoData/wms?service=WMS&version=1.1.0&request=GetMap&layers=geoData%3Aoc_boundaries&bbox=-181.8000030517578%2C-77.21341705322266%2C181.8000030517578%2C90.40480041503906&width=768&height=354&srs=EPSG%3A4326&styles=&format=image%2Fpng",
        type: "WMS",
      },
      {
        name: "全球地质区域及其类型和最后一次造山事件数据集(2022年)",
        url: "http://172.21.252.158:8181/geoserver/geoData/wms?service=WMS&version=1.1.0&request=GetMap&layers=geoData%3Aglobal_gprv&bbox=-181.8000030517578%2C-90.89899444580078%2C181.8000030517578%2C90.89999389648438&width=768&height=383&srs=EPSG%3A4326&styles=&format=image%2Fpng",
        type: "WMS",
      },
    ],
  },
]);

// 底图配置
const basemaps = [
  { id: 'streets', name: '街道地图', style: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'satellite', name: '卫星影像', style: 'mapbox://styles/mapbox/satellite-v9' },
  { id: 'light', name: '浅色底图', style: 'mapbox://styles/mapbox/light-v11' },
  { id: 'dark', name: '深色底图', style: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'outdoors', name: '地形图', style: 'mapbox://styles/mapbox/outdoors-v12' }
];

// 计算是否显示任何组件
const showAnyComponent = computed(() => 
  showFileUpload.value || showFilePagination.value
);

// 切换文件上传组件
const toggleFileUpload = () => {
  showFileUpload.value = !showFileUpload.value;
  showFilePagination.value = false;
};

// 切换文件分页展示组件
const toggleFilePagination = () => {
  showFilePagination.value = !showFilePagination.value;
  showFileUpload.value = false;
};

// 切换地图显示
const toggleMap = () => {
  showMap.value = !showMap.value;
};

// 切换专题底图数据面板
const toggleMapDataPanel = () => {
  showMapDataPanel.value = !showMapDataPanel.value;
};

// 切换分组展开/折叠
const toggleGroup = (index: number) => {
  layerGroups.value[index].expanded = !layerGroups.value[index].expanded;
};

// 切换图层显示
const toggleLayer = (layer: Layer) => {
  const isActive = activeLayers.value.includes(layer.name);
  
  if (isActive) {
    // 如果图层已激活，则移除
    const index = activeLayers.value.indexOf(layer.name);
    if (index !== -1) {
      activeLayers.value.splice(index, 1);
    }
    removeLayer(layer.name);
  } else {
    // 如果图层未激活，则添加
    activeLayers.value.push(layer.name);
    addLayer(layer);
  }
};

// 添加图层
const addLayer = (layer: Layer) => {
  if (mapRef.value) {
    mapRef.value.addLayer(layer);
  }
};

// 移除图层
const removeLayer = (layerName: string) => {
  if (mapRef.value) {
    mapRef.value.removeLayer(layerName);
  }
};

// 清除所有图层
const clearAllLayers = () => {
  activeLayers.value = [];
  if (mapRef.value) {
    mapRef.value.clearAllLayers();
  }
};

// 切换底图
const changeBasemap = (mapId: string) => {
  if (currentBasemap.value === mapId) return; // 避免重复切换相同底图
  
  isBasemapLoading.value = true;
  currentBasemap.value = mapId;
  
  if (mapRef.value) {
    mapRef.value.changeBasemap(mapId);
  }
  
  showBasemapSelector.value = false; // 选择后关闭选择器
};

// 处理底图加载完成事件
const handleBasemapLoaded = (mapId: string) => {
  if (currentBasemap.value === mapId) {
    isBasemapLoading.value = false;
  }
};

// 添加处理图层变化的方法
const handleLayerChange = (layer: Layer) => {
  if (activeLayers.value.includes(layer.name)) {
    addLayer(layer);
  } else {
    removeLayer(layer.name);
  }
};

// 处理书籍查看器状态变化
const handleBookViewerChange = (isVisible: boolean) => {
  showBookViewer.value = isVisible;
};

// 添加测量面板相关状态
const showMeasurePanel = ref(false);

// 切换测量面板显示
const toggleMeasurePanel = () => {
  showMeasurePanel.value = !showMeasurePanel.value;
};

// 处理测量工具操作
const handleMeasure = (action: string) => {
  if (!mapRef.value) return;
  
  switch (action) {
    case 'reset':
      mapRef.value.resetView();
      break;
    case 'distance':
      mapRef.value.toggleMeasurement('distance');
      break;
    case 'area':
      mapRef.value.toggleMeasurement('area');
      break;
    case 'clear':
      mapRef.value.clearMeasurements();
      break;
  }
  showMeasurePanel.value = false;
};

// 添加点击外部关闭测量面板
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.control-btn')) {
    showMeasurePanel.value = false;
  }
  
  // 点击外部关闭底图选择器
  if (showBasemapSelector.value && !target.closest('.basemap-switcher')) {
    showBasemapSelector.value = false;
  }
};

// 切换底图选择器显示
const toggleBasemapSelector = () => {
  showBasemapSelector.value = !showBasemapSelector.value;
};

// 获取路由实例
const router = useRouter();

// 添加导航到书籍列表页面的方法
const navigateToBooks = () => {
  router.push('/books');
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.map-container {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif;
}

/* 分屏模式下的容器样式 */
.map-container.split-mode #controls {
  right: 42%; /* 确保在分屏时位于地图区域内 */
  width: 280px;
}

.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 400px; /* 增加宽度以适应横向按钮 */
  background: rgba(10, 18, 25, 0.85); /* 半透明深色背景 */
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  padding: 16px;
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(26, 38, 53, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.control-panel h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(26, 38, 53, 0.8);
  text-align: center;
  position: relative;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 229, 176, 0.2);
}

.control-panel h3::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, rgba(0, 229, 176, 0.2) 0%, rgba(0, 229, 176, 1) 50%, rgba(0, 229, 176, 0.2) 100%);
  border-radius: 2px;
}

.control-buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-bottom: 16px;
  justify-content: space-between;
}

.control-btn {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 4px;
  background: rgba(17, 26, 36, 0.8);
  border: 1px solid rgba(26, 38, 53, 0.8);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 60px;
  overflow: hidden;
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 229, 176, 0.05) 0%, rgba(0, 163, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.control-btn:hover {
  background: rgba(26, 38, 53, 0.9);
  border-color: #00e5b0;
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 229, 176, 0.15);
}

.control-btn:hover::before {
  opacity: 1;
}

.btn-icon {
  font-size: 22px;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;
}

.control-btn:hover .btn-icon {
  transform: scale(1.1);
}

.btn-text {
  font-size: 13px;
  color: #ffffff;
  white-space: nowrap;
  font-weight: 500;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.control-btn:hover .btn-text {
  color: #00e5b0;
}

.panel-content {
  margin-top: 16px;
  padding: 16px;
  background: rgba(17, 26, 36, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(26, 38, 53, 0.8);
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  width: 100%;
  color: #ffffff;
  box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.1);
}

/* 自定义滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(10, 18, 25, 0.5);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 176, 0.3);
}

/* 专题底图数据面板样式 */
#controls {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 300px;
  background: rgba(10, 18, 25, 0.85);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(26, 38, 53, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  opacity: 0;
  visibility: hidden;
  transform: translateX(100px);
  z-index: 1001;
  color: #ffffff;
}

#controls.controls-visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

/* 分屏模式下的专题底图数据面板样式 */
.split-mode #controls.controls-visible {
  right: 42%;
  width: 280px;
  top: 80px;
}

#controls h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 700;
  padding-bottom: 14px;
  border-bottom: 2px solid rgba(26, 38, 53, 0.8);
  text-align: center;
  position: relative;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 229, 176, 0.2);
}

#controls h3::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, rgba(0, 229, 176, 0.2) 0%, rgba(0, 229, 176, 1) 50%, rgba(0, 229, 176, 0.2) 100%);
  border-radius: 2px;
}

#controls .group-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 14px 18px;
  background: rgba(17, 26, 36, 0.8);
  border: 1px solid rgba(26, 38, 53, 0.8);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}

#controls .group-title::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 229, 176, 0.05) 0%, rgba(0, 163, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

#controls .group-title:hover {
  background: rgba(26, 38, 53, 0.9);
  border-color: #00e5b0;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 229, 176, 0.15);
}

#controls .group-title:hover::before {
  opacity: 1;
}

#controls .group-title strong {
  font-size: 16px;
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

#controls .group-title:hover strong {
  color: #00e5b0;
}

#controls .group-title span {
  color: #a0aec0;
  font-size: 16px;
  font-weight: bold;
  position: relative;
  z-index: 1;
}

#controls .layer-list {
  padding: 14px 18px 14px 24px;
  background: rgba(10, 18, 25, 0.6);
  border-radius: 10px;
  margin: 6px 0 18px;
  border: 1px solid rgba(26, 38, 53, 0.8);
  box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.1);
}

#controls .layer-list li {
  display: flex;
  align-items: center;
  padding: 10px 0;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin-bottom: 6px;
}

#controls .layer-list li:hover {
  background: rgba(17, 26, 36, 0.8);
  padding-left: 8px;
  padding-right: 8px;
}

#controls input[type="checkbox"] {
  margin-right: 12px;
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #00e5b0;
}

#controls label {
  cursor: pointer;
  font-size: 15px;
  color: #a0aec0;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
}

#controls label:hover {
  color: #ffffff;
}

/* 清除按钮容器样式 */
.clear-button-container {
  margin-bottom: 20px;
  padding: 0 4px;
}

.clear-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 18px; /* 增加内边距 */
  background: rgba(17, 26, 36, 0.8);
  border: 1px solid rgba(26, 38, 53, 0.8);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: #a0aec0;
  font-size: 16px; /* 增大字体 */
  font-weight: 600;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.clear-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.clear-button:hover:not(:disabled) {
  background: rgba(26, 38, 53, 0.9);
  border-color: #ef4444;
  color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(239, 68, 68, 0.15);
}

.clear-button:hover:not(:disabled)::before {
  opacity: 1;
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-icon {
  margin-right: 12px; /* 增加右侧间距 */
  font-size: 18px; /* 增大图标尺寸 */
  position: relative;
  z-index: 1;
}

/* 底图选择可视化窗口样式 */
.basemap-visualizer {
  display: none; /* 隐藏旧的底图选择器 */
}

/* 新的底图切换器样式 */
.basemap-switcher {
  position: absolute;
  bottom: 80px;
  right: 80px;
  z-index: 1000;
}

.basemap-toggle {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 4px;
  padding: 8px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.basemap-toggle:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.toggle-icon {
  font-size: 18px;
  margin-right: 8px;
}

.toggle-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.basemap-selector {
  position: absolute;
  bottom: 0; /* 与底图切换按钮底部对齐 */
  right: 100%; /* 放置在按钮的左侧 */
  margin-right: 10px; /* 与按钮保持一定距离 */
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 10px;
  width: 400px;
  transform-origin: bottom right; /* 从右下角展开 */
  animation: popup 0.3s ease-out;
  z-index: 1001;
}

@keyframes popup {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.basemap-options {
  display: flex; /* 改为flex布局 */
  flex-direction: row; /* 横向排列 */
  justify-content: space-between; /* 均匀分布 */
  gap: 15px; /* 增加间距从10px到15px */
}

.basemap-option {
  flex: 1; /* 让每个选项平均分配空间 */
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.basemap-option:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.basemap-option.active {
  border-color: #4285f4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.3);
  transform: scale(1.05);
}

.basemap-option.active::before {
  content: '✓';
  position: absolute;
  top: 5px;
  right: 5px;
  width: 18px;
  height: 18px;
  background: #4285f4;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  z-index: 2;
}

.basemap-option.loading .option-preview {
  opacity: 0.6;
}

.loading-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4285f4;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.option-preview {
  height: 60px; /* 减小高度以适应横向排列 */
  width: 100%;
  background-size: cover;
  background-position: center;
}

.option-preview.streets {
  background-image: url('https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/0,0,1/300x300?access_token=pk.eyJ1IjoiY3VkODUiLCJhIjoiY2xrYnFncXZhMGc1cTNlbmFrNHN1N2cxeCJ9.69E3f8nMJkvqQDRhLSojVw');
}

.option-preview.satellite {
  background-image: url('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/0,0,1/300x300?access_token=pk.eyJ1IjoiY3VkODUiLCJhIjoiY2xrYnFncXZhMGc1cTNlbmFrNHN1N2cxeCJ9.69E3f8nMJkvqQDRhLSojVw');
}

.option-preview.light {
  background-image: url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/0,0,1/300x300?access_token=pk.eyJ1IjoiY3VkODUiLCJhIjoiY2xrYnFncXZhMGc1cTNlbmFrNHN1N2cxeCJ9.69E3f8nMJkvqQDRhLSojVw');
}

.option-preview.dark {
  background-image: url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/0,0,1/300x300?access_token=pk.eyJ1IjoiY3VkODUiLCJhIjoiY2xrYnFncXZhMGc1cTNlbmFrNHN1N2cxeCJ9.69E3f8nMJkvqQDRhLSojVw');
}

/* 分屏模式下的底图选择器位置调整 */
.split-mode .basemap-switcher {
  right: 42%;
}

/* 分屏模式下不需要特殊调整弹出位置，因为使用了相对定位 */
/* .split-mode .basemap-selector {
  right: -300px;
} */

/* 添加底图名称显示 */
.basemap-option::after {
  content: attr(data-name);
  display: block;
  text-align: center;
  padding: 5px 0;
  font-size: 12px;
  color: #333;
  background: rgba(255, 255, 255, 0.8);
  position: absolute;
  bottom: 0;
  width: 100%;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .basemap-selector {
    width: 320px; /* 在小屏幕上减小宽度 */
    margin-right: 5px; /* 在小屏幕上减小间距 */
  }
  
  .option-preview {
    height: 50px; /* 在小屏幕上减小高度 */
  }
  
  .basemap-option::after {
    font-size: 10px; /* 在小屏幕上减小字体大小 */
    padding: 3px 0;
  }
}
</style>