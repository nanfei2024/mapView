<template>
  <div class="app-layout">
    <!-- 左侧侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 顶部Logo区域 -->
      <div class="sidebar-header">
        <div class="logo-container">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text" v-if="!sidebarCollapsed">地质信息系统</span>
        </div>
        <button class="collapse-btn" @click="toggleSidebar">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- 功能菜单 -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title" v-if="!sidebarCollapsed">核心功能</div>
          
          <div class="nav-item" @click="navigateToDocumentDigitalization" title="地质文档数字化">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="nav-text" v-if="!sidebarCollapsed">文档数字化</span>
        </div>

          <div class="nav-item" @click="navigateToFileList" title="文件管理">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="nav-text" v-if="!sidebarCollapsed">文件管理</span>
        </div>

          <div class="nav-item" @click="toggleMeasurePanel" title="测量工具">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L20 20M4 20L20 4M8 12H16M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="nav-text" v-if="!sidebarCollapsed">测量工具</span>
            <!-- 测量工具子菜单 -->
            <div class="sub-menu" v-show="showMeasurePanel">
              <div class="sub-menu-item" @click.stop="handleMeasure('reset')">
                <svg class="sub-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M21.168 8A10.003 10.003 0 0 0 12 2C6.815 2 2.55 5.947 2.05 11" stroke="currentColor" stroke-width="2"/>
                  <path d="M3 16a10.003 10.003 0 0 0 9 6c5.185 0 9.45-3.947 9.95-9" stroke="currentColor" stroke-width="2"/>
                </svg>
              <span>重置视图</span>
            </div>
              <div class="sub-menu-item" @click.stop="handleMeasure('distance')">
                <svg class="sub-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M5 12L9 8M5 12L9 16M19 12L15 8M19 12L15 16" stroke="currentColor" stroke-width="2"/>
                </svg>
              <span>测距</span>
            </div>
              <div class="sub-menu-item" @click.stop="handleMeasure('area')">
                <svg class="sub-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              <span>测面</span>
            </div>
              <div class="sub-menu-item" @click.stop="handleMeasure('clear')">
                <svg class="sub-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H21M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6H19Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              <span>清除</span>
            </div>
          </div>
        </div>

          <div class="nav-item" @click="toggleMapDataPanel" title="底图数据">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V16C3 17.1046 3.89543 18 5 18H16M21 21L21 8M21 21L8 21M21 21L16 16L12 19L8 15L3 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="nav-text" v-if="!sidebarCollapsed">底图数据</span>
        </div>

          <div class="nav-item" @click="navigateToBooks" title="书籍查看">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6.5C10.5 4.5 8 3 5 3V19C8 19 10.5 20.5 12 22.5C13.5 20.5 16 19 19 19V3C16 3 13.5 4.5 12 6.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="nav-text" v-if="!sidebarCollapsed">书籍查看</span>
        </div>

          <div class="nav-item" @click="togglePlateManager" title="板块数据管理">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" stroke-width="2"/>
              <path d="M3 10H21M8 5V19" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="nav-text" v-if="!sidebarCollapsed">板块管理</span>
          </div>

          <div class="nav-item" @click="toggleBasemapPanel" title="底图切换">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H21V21H3V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 9H21M3 15H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 3V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="nav-text" v-if="!sidebarCollapsed">底图切换</span>
            <!-- 底图切换子菜单 -->
            <div class="sub-menu basemap-sub-menu" v-show="showBasemapPanel">
              <div 
                v-for="map in basemaps" 
                :key="map.id"
                class="sub-menu-item"
                :class="{ active: currentBasemap === map.id }"
                @click.stop="changeBasemap(map.id)"
              >
                <svg class="sub-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>{{ map.name }}</span>
                <svg v-if="currentBasemap === map.id" class="check-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
        </div>
      </div>

          <div class="nav-item" @click="toggleAIChat" title="AI助手">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 9H9.01M12 9H12.01M15 9H15.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="nav-text" v-if="!sidebarCollapsed">AI助手</span>
      </div>
    </div>
      </nav>

      <!-- 侧边栏底部 -->
      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <div class="user-info">
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="user-details">
            <div class="user-name">地质研究员</div>
            <div class="user-status">在线</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧主内容区 -->
    <div class="main-content" :class="{ expanded: sidebarCollapsed, 'split-mode': showBookViewer }">
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
        :showPlateManager="showPlateManager"
        @close-plate-manager="showPlateManager = false"
        ref="mapRef"
        @book-viewer-change="handleBookViewerChange"
      />
    
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
    
    <!-- AI助手聊天盒子 -->
    <AIChatBox 
      v-if="showAIChat" 
      @close="showAIChat = false"
      :class="{ 'ai-chat-with-viewer': showBookViewer }"
    />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import MapVisualization from '../components/MapVisualization.vue';
import AIChatBox from '../components/AIChatBox.vue';

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

const showMap = ref(true);
const showMapDataPanel = ref(false);
const showBookViewer = ref(false);
const mapRef = ref<InstanceType<typeof MapVisualization> | null>(null);
const sidebarCollapsed = ref(false);

// 添加底图相关状态
const showBasemapPanel = ref(false);
const currentBasemap = ref('streets');
const activeLayers = ref<string[]>([]);

// AI助手状态
const showAIChat = ref(false);

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
  false // 所有组件已移至独立页面
);

// 获取路由实例
const router = useRouter();

// 导航到文档数字化页面
const navigateToDocumentDigitalization = () => {
  router.push('/document-digitalization');
};

// 导航到文件列表页面（包含文件、图库、表库三个标签）
const navigateToFileList = () => {
  router.push('/file-list');
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
  
  showBasemapPanel.value = false; // 选择后关闭面板
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

// 添加板块数据管理面板状态
const showPlateManager = ref(false);

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

// 添加点击外部关闭面板
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.nav-item')) {
    showMeasurePanel.value = false;
    showBasemapPanel.value = false;
  }
};

// 添加导航到书籍列表页面的方法
const navigateToBooks = () => {
  router.push('/books');
};

// 切换板块数据管理面板
const togglePlateManager = () => {
  showPlateManager.value = !showPlateManager.value;
};

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 切换底图面板
const toggleBasemapPanel = () => {
  showBasemapPanel.value = !showBasemapPanel.value;
  // 关闭其他面板
  if (showBasemapPanel.value) {
    showMeasurePanel.value = false;
  }
};

// 切换AI助手
const toggleAIChat = () => {
  showAIChat.value = !showAIChat.value;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* 全局布局 */
.app-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  background: #f5f7fa;
}

/* ========== 侧边栏样式 ========== */
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1a1d29 0%, #0f1419 100%);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  position: relative;
}

.sidebar.collapsed {
  width: 70px;
}

/* 侧边栏头部 */
.sidebar-header {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: #10b981;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.collapse-btn svg {
  width: 20px;
  height: 20px;
  color: #9ca3af;
  transition: all 0.3s ease;
}

.sidebar.collapsed .collapse-btn svg {
  transform: rotate(180deg);
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.collapse-btn:hover svg {
  color: #10b981;
}

/* 侧边栏导航 */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;  /* 允许子菜单显示在侧边栏外 */
  padding: 12px 8px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

.nav-section {
  margin-bottom: 24px;
}

.nav-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 8px 12px;
  margin-bottom: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #9ca3af;
  position: relative;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  border-radius: 0 3px 3px 0;
  transition: height 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.nav-item:hover::before {
  height: 70%;
}

.nav-item:active {
  background: rgba(255, 255, 255, 0.08);
  transform: scale(0.98);
}

.nav-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  stroke-width: 2;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* 子菜单样式 */
.sub-menu {
  position: absolute;
  left: 100%;
  top: 0;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 8px;
  padding: 8px;
  margin-left: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  z-index: 1001;
  animation: slideInRight 0.2s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
  opacity: 1;
    transform: translateX(0);
  }
}

.sub-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #9ca3af;
  font-size: 14px;
}

.sub-menu-item:hover {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.sub-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* 底图子菜单特殊样式 */
.basemap-sub-menu {
  min-width: 200px;
}

.basemap-sub-menu .sub-menu-item {
  justify-content: space-between;
}

.basemap-sub-menu .sub-menu-item.active {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: #10b981;
  flex-shrink: 0;
  margin-left: auto;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.08);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar svg {
  width: 20px;
  height: 20px;
  color: #ffffff;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: 12px;
  color: #10b981;
}

/* ========== 主内容区 ========== */
.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0;
}

.main-content.expanded {
  margin-left: 0;
}

/* 分屏模式下的容器样式 */
.main-content.split-mode #controls {
  right: 42%;
  width: 280px;
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

/* AI助手聊天盒子样式 */
.ai-chat-with-viewer {
  right: 42%;
}
</style>