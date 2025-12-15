<template>
  <div class="map-container">
    <!-- 添加分屏容器 -->
    <div class="split-container" :class="{ 'split-active': showBookViewer }">
      <!-- 左侧地图区域 -->
      <div class="map-section" :class="{ 'map-shrink': showBookViewer }">
        <div id="map" ref="mapContainer"></div>
      </div>

      <!-- 右侧书籍查看器 -->
      <div class="book-viewer" :class="{ 'viewer-show': showBookViewer }">
        <div class="viewer-header">
          <h3>{{ currentBook.title || '板块信息' }}</h3>
          <button class="close-viewer" @click="closeBookViewer">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="viewer-content">
          <!-- 切换按钮组 -->
          <div class="content-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'info' }"
              @click="switchTab('info')"
            >
              <span class="tab-icon">📖</span>
              <span>书籍信息</span>
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'text' }"
              @click="switchTab('text')"
            >
              <span class="tab-icon">📝</span>
              <span>文字内容</span>
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'image' }"
              @click="switchTab('image')"
            >
              <span class="tab-icon">🖼️</span>
              <span>图片展示</span>
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'table' }"
              @click="switchTab('table')"
            >
              <span class="tab-icon">📊</span>
              <span>表格展示</span>
            </button>
          </div>
          
          <!-- 内容显示区域 -->
          <div class="content-display">
            <div v-if="activeTab === 'info'" class="content-section">
              <div v-if="pdfUrl" id="pdf-container" class="pdf-container"></div>
              <div v-else class="content-placeholder">
                <h3>{{ currentBook.title }}</h3>
                <p>这里将显示关于 {{ currentBook.title }} 的详细信息。</p>
                <div class="placeholder-content">
                  <p>板块基本信息</p>
                  <ul>
                    <li>位置：亚洲地区</li>
                    <li>面积：约 XXX 平方公里</li>
                    <li>形成时期：XXX</li>
                  </ul>
                </div>
              </div>
            </div>
            <div v-if="activeTab === 'text'" class="content-section">
              <div v-if="markdownContent" class="markdown-container">
                <div class="markdown-toolbar">
                  <button class="toolbar-btn" @click="toggleEditMode">
                    {{ isEditMode ? '预览' : '编辑' }}
                  </button>
                  <button class="toolbar-btn" @click="saveMarkdown" v-if="isEditMode">
                    保存
                  </button>
                </div>
                <div v-if="isEditMode" class="markdown-editor">
                  <textarea 
                    v-model="rawMarkdownContent" 
                    class="markdown-textarea"
                    placeholder="编辑Markdown内容..."
                  ></textarea>
                </div>
                <div v-else class="markdown-content" v-html="markdownContent"></div>
              </div>
              <div v-else class="content-placeholder">
                <h3>文字描述</h3>
                <p>这里将显示关于 {{ currentBook.title }} 的详细文字描述。</p>
                <div class="placeholder-content">
                  <p>板块详细信息将在这里展示...</p>
                </div>
              </div>
            </div>
            <div v-if="activeTab === 'image'" class="content-section">
              <div v-if="imageList.length > 0" class="image-container">
                <div class="image-navigation">
                  <span class="image-counter">{{ currentImageIndex + 1 }} / {{ imageList.length }}</span>
                  <div class="image-nav-buttons">
                    <button 
                      class="nav-btn prev-btn" 
                      @click="prevImage" 
                      :disabled="currentImageIndex === 0"
                    >
                      ◀
                    </button>
                    <button 
                      class="nav-btn next-btn" 
                      @click="nextImage" 
                      :disabled="currentImageIndex === imageList.length - 1"
                    >
                      ▶
                    </button>
                  </div>
                </div>
                <img :src="imageUrl" alt="板块图片" class="plate-image" />
                <div class="image-title">{{ imageList[currentImageIndex]?.title || '图片' }}</div>
                
                <div class="image-thumbnails">
                  <div 
                    v-for="(img, index) in imageList" 
                    :key="index" 
                    class="thumbnail-item"
                    :class="{ active: index === currentImageIndex }"
                    @click="selectImage(index)"
                  >
                    <img :src="img.url" :alt="img.title" class="thumbnail-img" />
                  </div>
                </div>
              </div>
              <div v-else class="content-placeholder">
                <h3>图片展示</h3>
                <p>这里将显示关于 {{ currentBook.title }} 的相关图片。</p>
                <div class="placeholder-content">
                  <div class="image-placeholder">
                    <span class="placeholder-icon">🖼️</span>
                    <p>图片加载区域</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="activeTab === 'table'" class="table-display">
              <div class="table-header">
                <h4>数据表格展示</h4>
                <div class="table-actions">
                  <button class="action-btn refresh-btn" @click="fetchTableData">
                    <span>🔄</span>
                  </button>
                </div>
              </div>
              <div class="table-content">
                <!-- 表格列表 -->
                <div v-if="tableList.length > 0" class="table-list">
                  <div class="table-list-header">
                    <h5>可用表格</h5>
                  </div>
                  <div class="table-list-items">
                    <div 
                      v-for="(table, index) in tableList" 
                      :key="index"
                      class="table-list-item"
                      :class="{ active: currentTableIndex === index }"
                      @click="selectTable(index)"
                    >
                      <span class="table-icon">📊</span>
                      <span class="table-name">{{ table.name }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 表格图片显示 -->
                <div v-if="currentTableUrl" class="table-image-container">
                  <div class="table-navigation">
                    <span class="table-counter">{{ currentTableIndex + 1 }} / {{ tableList.length }}</span>
                    <div class="table-nav-buttons">
                      <button 
                        class="nav-btn prev-btn" 
                        @click="prevTable" 
                        :disabled="currentTableIndex === 0"
                      >
                        ◀
                      </button>
                      <button 
                        class="nav-btn next-btn" 
                        @click="nextTable" 
                        :disabled="currentTableIndex === tableList.length - 1"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                  <img :src="currentTableUrl" alt="表格图片" class="table-image" />
                  <div class="table-title">{{ tableList[currentTableIndex]?.name || '表格' }}</div>
                </div>
                
                <!-- 空状态 -->
                <div v-else-if="tableLoading" class="table-loading">
                  <div class="loading-spinner"></div>
                  <p>正在加载表格数据...</p>
                </div>
                <div v-else class="table-placeholder">
                  <div class="placeholder-icon">📊</div>
                  <p>{{ currentBook.title }} 的数据表格</p>
                  <p class="note">{{ tableError || '此区域将显示表格图片' }}</p>
                  <button v-if="tableError" class="retry-btn" @click="fetchTableData">重试</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 板块数据管理侧边栏 -->
    <SidebarPlateManager
      v-if="showPlateManager"
      :map="map"
      @close="$emit('close-plate-manager')"
      class="sidebar-plate-manager"
    />
  </div>
</template>

<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ref, onMounted, nextTick, computed, watch } from "vue";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import FileUpload from './FileUpload.vue';
import FilePagination from './FilePagination.vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import * as pdfjsLib from 'pdfjs-dist';
import { marked } from 'marked';
import SidebarPlateManager from './SidebarPlateManager.vue';

// 设置 Mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoiY3VkODUiLCJhIjoiY2xrYnFncXZhMGc1cTNlbmFrNHN1N2cxeCJ9.69E3f8nMJkvqQDRhLSojVw";

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// 声明 MapboxDraw 模块
// 注意：这里不使用 declare module，而是直接使用导入的类型
// declare module '@mapbox/mapbox-gl-draw';

// 定义接口
interface Layer {
  name: string;
  url: string;
  type: string;
  layerName?: string;
}

// 定义 Book 接口
interface Book {
  title: string;
  infoUrl?: string;
  textUrl?: string;
  imageUrl?: string;
  url: string;
}

// 定义API响应接口
interface ApiResponse {
  content?: any[];
  images?: any[];
  totalRecords?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  [key: string]: any;
}

// 定义章节图片响应接口
interface ChapterImagesResponse {
  images?: Array<{
    url: string;
    title?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// 定义文件接口
interface FileInfo {
  id: string;
  file_path: string;
  [key: string]: any;
}

// 定义props
const props = defineProps<{
  activeLayers: string[];
  currentBasemap: string;
  showPlateManager?: boolean;
}>();

// 定义emits
const emit = defineEmits<{
  'toggle-layer': [layer: Layer];
  'add-layer': [layer: Layer];
  'remove-layer': [layerName: string];
  'clear-all-layers': [];
  'change-basemap': [mapId: string];
  'basemap-loaded': [mapId: string];
  'book-viewer-change': [isVisible: boolean];
  'close-plate-manager': [];
}>();

// Mapbox 相关初始化
const mapContainer = ref<HTMLElement | null>(null);
const map = ref<mapboxgl.Map | null>(null);
const draw = ref<MapboxDraw | null>(null);
const currentTool = ref<string | null>(null);

// 图层分组配置
const layerGroups = ref([
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

// 添加底图相关状态
const showBasemapList = ref(false);
const currentBasemap = ref('streets');

// 底图配置
const basemaps = [
  { id: 'streets', name: '街道地图', style: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'satellite', name: '卫星影像', style: 'mapbox://styles/mapbox/satellite-v9' },
  { id: 'light', name: '浅色底图', style: 'mapbox://styles/mapbox/light-v11' },
  { id: 'dark', name: '深色底图', style: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'outdoors', name: '地形图', style: 'mapbox://styles/mapbox/outdoors-v12' }
];

// 切换底图列表显示
const toggleBasemapList = () => {
  showBasemapList.value = !showBasemapList.value;
};

// 切换底图
const changeBasemap = (mapId: string) => {
  if (!map.value) return;

  const selectedMap = basemaps.find(m => m.id === mapId);
  if (selectedMap) {
    // 保存当前的投影模式
    const currentProjection = map.value.getProjection();
    
    // 设置新样式
    map.value.setStyle(selectedMap.style);
    
    // 样式加载后恢复投影模式
    map.value.once('style.load', () => {
      // 恢复3D地球模式
      if (currentProjection && currentProjection.name === 'globe') {
        map.value?.setProjection('globe');
        
        // 重新设置大气层效果
        map.value?.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6
        });
      }
      
      // 发送底图加载完成事件
      emit('basemap-loaded', mapId);
    });
    
    currentBasemap.value = mapId;
  }
  showBasemapList.value = false;
  emit('change-basemap', mapId);
};

// 切换分组展开/折叠
const toggleGroup = (index: number) => {
  layerGroups.value[index].expanded = !layerGroups.value[index].expanded;
};

// 切换图层的显示/隐藏
const toggleLayer = (layer: Layer) => {
  const isActive = props.activeLayers.includes(layer.name);
  if (isActive) {
    removeLayer(layer.name);
  } else {
    addLayer(layer);
  }
  emit('toggle-layer', layer);
};

// 添加图层到地图
const addLayer = (layer: Layer) => {
  if (!map.value) return;

  // 检查图层是否已经存在于地图中
  if (map.value.getLayer(layer.name)) {
    console.log(`图层 ${layer.name} 已存在，不重复添加`);
    return;
  }

  // 先尝试移除同名图层，确保不会有冲突
  removeLayer(layer.name);

  if (layer.type === "WFS") {
    // WFS 图层
    const wfsUrl = `${layer.url}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layer.layerName}&maxFeatures=50&outputFormat=application/json`;

    // 显示加载中提示
    const loadingMessage = ElMessage({
      message: `正在加载图层: ${layer.name}`,
      type: 'info',
      duration: 0
    });

    // 使用标志防止重复加载
    const layerLoadingKey = `loading_${layer.name}`;
    if ((window as any)[layerLoadingKey]) {
      console.log(`图层 ${layer.name} 正在加载中，不重复请求`);
      loadingMessage.close();
      return;
    }
    
    (window as any)[layerLoadingKey] = true;

    fetch(wfsUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!map.value) return;
        
        // 关闭加载提示
        loadingMessage.close();
        // 清除加载标志
        (window as any)[layerLoadingKey] = false;
        
        // 检查数据有效性
        if (!data || !data.features || data.features.length === 0) {
          console.warn(`图层 ${layer.name} 没有返回有效数据`);
          ElMessage.warning(`图层 ${layer.name} 没有数据可显示`);
          return;
        }

        // 再次检查图层是否已存在
        if (map.value.getLayer(layer.name)) {
          console.log(`图层 ${layer.name} 已存在，不重复添加`);
          return;
        }

        // 添加 GeoJSON 数据源
        try {
          // 检查数据源是否已存在
          if (map.value.getSource(layer.name)) {
            map.value.removeSource(layer.name);
          }
          
          map.value.addSource(layer.name, {
            type: "geojson",
            data: data,
          });

          // 添加图层
          map.value.addLayer({
            id: layer.name,
            type: "fill",
            source: layer.name,
            paint: {
              "fill-color": getRandomColor(),
              "fill-opacity": 0.5,
            },
          });
          
          // 如果是主板块图层，添加点击事件监听器
          if (layer.name === "主板块") {
            console.log('添加主板块点击事件监听器');
            // 先移除可能存在的旧监听器，避免重复
            try {
              map.value.off('click', layer.name, showBookInfo);
            } catch (e) {
              console.log('移除旧监听器失败，可能不存在', e);
            }
            // 添加新的监听器
            map.value.on('click', layer.name, showBookInfo);
          }
          
          // 发出图层添加成功事件
          emit('add-layer', layer);
          ElMessage.success(`图层 ${layer.name} 加载成功`);
        } catch (error) {
          console.error(`添加图层 ${layer.name} 失败:`, error);
          ElMessage.error(`添加图层 ${layer.name} 失败: ${error}`);
        }
      })
      .catch((error) => {
        // 关闭加载提示
        loadingMessage.close();
        // 清除加载标志
        (window as any)[layerLoadingKey] = false;
        console.error(`加载WFS图层 ${layer.name} 失败:`, error);
        ElMessage.error(`加载图层 ${layer.name} 失败: ${error.message || '未知错误'}`);
      });
  } else if (layer.type === "WMS") {
    // WMS 图层
    try {
      // 检查图层是否已存在
      if (map.value.getLayer(layer.name)) {
        console.log(`图层 ${layer.name} 已存在，不重复添加`);
        return;
      }
      
      map.value.addLayer({
        id: layer.name,
        type: "raster",
        source: {
          type: "raster",
          tiles: [layer.url],
          tileSize: 256,
        },
        paint: {
          "raster-opacity": 0.7,
        },
      });
      emit('add-layer', layer);
      ElMessage.success(`图层 ${layer.name} 加载成功`);
    } catch (error) {
      console.error(`添加WMS图层 ${layer.name} 失败:`, error);
      ElMessage.error(`添加图层 ${layer.name} 失败: ${error}`);
    }
  }
};

// 从地图移除图层
const removeLayer = (layerName: string) => {
  if (!map.value) return;

  try {
    // 如果是主板块图层，移除点击事件监听器
    if (layerName === "主板块" && map.value.getLayer(layerName)) {
      console.log('移除主板块点击事件监听器');
      try {
        map.value.off('click', layerName, showBookInfo);
      } catch (e) {
        console.log('移除监听器失败', e);
      }
    }

    // 移除图层
    if (map.value.getLayer(layerName)) {
      map.value.removeLayer(layerName);
      console.log(`图层 ${layerName} 已移除`);
    }
    
    // 移除数据源 (需要在移除图层后进行)
    if (map.value.getSource(layerName)) {
      map.value.removeSource(layerName);
      console.log(`数据源 ${layerName} 已移除`);
    }

    emit('remove-layer', layerName);
  } catch (error) {
    console.error(`移除图层 ${layerName} 失败:`, error);
    // 不向用户显示移除失败的消息，避免干扰
  }
};

// 随机生成图层颜色
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// 清除所有图层
const clearAllLayers = () => {
  console.log('清除所有图层，当前活动图层:', props.activeLayers);
  
  // 创建一个副本以避免在迭代过程中修改数组
  const layersToRemove = [...props.activeLayers];
  
  layersToRemove.forEach(layerName => {
    console.log(`正在移除图层: ${layerName}`);
    removeLayer(layerName);
  });
  
  emit('clear-all-layers');
  ElMessage.success('所有图层已清除');
};

// 切换地图显示
const toggleMap = () => {
  showMap.value = !showMap.value;
};

// 添加活动标签状态
const activeTab = ref('info');  // 默认显示书籍信息

// 添加 resetView 方法
const resetView = () => {
  if (!map.value) return;
  map.value.flyTo({
    center: [118.7915619, 32.0615513],
    zoom: 3,
    bearing: 0,
    pitch: 0
  });
};

// 添加 handleToggleLayers 方法
const handleToggleLayers = (layers: string[]) => {
  console.log('处理图层切换:', layers);
  
  layers.forEach(layerName => {
    const layer = findLayerByName(layerName);
    if (layer) {
      console.log(`找到图层 ${layerName}，检查状态`);
      if (props.activeLayers.includes(layerName)) {
        console.log(`图层 ${layerName} 已激活，准备移除`);
        removeLayer(layerName);
      } else {
        console.log(`图层 ${layerName} 未激活，准备添加`);
        addLayer(layer);
      }
    } else {
      console.warn(`未找到图层: ${layerName}`);
    }
  });
};

// 添加辅助方法，根据名称查找图层
const findLayerByName = (layerName: string): Layer | undefined => {
  for (const group of layerGroups.value) {
    const layer = group.layers.find(l => l.name === layerName);
    if (layer) return layer;
  }
  return undefined;
};

// 添加测量相关方法
const toggleMeasurement = (type: string) => {
  if (!map.value || !draw.value) {
    console.error('地图或绘图工具未初始化');
    return;
  }

  try {
    // 清除之前的测量结果
    clearMeasurements();
    
    if (currentTool.value === type) {
      // 如果当前工具已经是选中的工具，则取消选择
      currentTool.value = null;
      draw.value.changeMode('simple_select');
    } else {
      // 设置新的测量工具
      currentTool.value = type;
      
      if (type === 'area') {
        draw.value.changeMode('draw_polygon');
      } else if (type === 'distance') {
        draw.value.changeMode('draw_line_string');
      }
      
      // 显示提示信息
      if (map.value) {
        const center = map.value.getCenter();
        // 将 Popup 实例存储在变量中，并使用类型断言
        const instructionPopup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          className: 'instruction-popup'
        }) as mapboxgl.Popup;
        
        // 设置内容并添加到地图
        instructionPopup
          .setLngLat(center)
          .setHTML(`<div>请在地图上绘制${type === 'area' ? '多边形' : '线段'}进行测量</div>`);
          
        // 确保地图实例存在再添加
        if (map.value) {
          instructionPopup.addTo(map.value);
        }
          
        // 3秒后自动关闭提示
        setTimeout(() => {
          const instructionPopups = document.getElementsByClassName('instruction-popup');
          while(instructionPopups[0]) {
            instructionPopups[0].remove();
          }
        }, 3000);
      }
    }
  } catch (error) {
    console.error('切换测量工具失败:', error);
  }
};

// 更新测量结果显示方法
const updateMeasurement = (e: { features: any[] }) => {
  if (!e.features.length || !map.value) {
    console.warn('没有可用的测量特征或地图未初始化');
    return;
  }
  
  try {
    const data = e.features[0];
    let measurementText = '';
    let popupCoordinates: [number, number] = [0, 0];
    
    // 计算面积或距离
    if (data.geometry.type === 'Polygon' && currentTool.value === 'area') {
      const area = turf.area(data);
      const areaKm = (area / 1000000).toFixed(2);
      measurementText = `面积: ${areaKm} 平方公里`;
      popupCoordinates = data.geometry.coordinates[0][0];
      
    } else if (data.geometry.type === 'LineString' && currentTool.value === 'distance') {
      const length = turf.length(data, { units: 'kilometers' }).toFixed(2);
      measurementText = `距离: ${length} 公里`;
      const coordinates = data.geometry.coordinates;
      popupCoordinates = coordinates[coordinates.length - 1];
    } else {
      console.warn('不支持的几何类型或测量工具');
      return;
    }
    
    // 创建并显示测量结果弹窗
    if (map.value && measurementText) {
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'measurement-result'
      }) as mapboxgl.Popup;
      
      popup
        .setLngLat(popupCoordinates)
        .setHTML(`<div class="measurement-value">${measurementText}</div>`);
        
      // 确保地图实例存在再添加
      popup.addTo(map.value);
    }
  } catch (error) {
    console.error('更新测量结果失败:', error);
  }
};

// 清除测量
const clearMeasurements = () => {
  if (!draw.value) {
    console.warn('绘图工具未初始化');
    return;
  }

  try {
    // 删除所有绘制的图形
    draw.value.deleteAll();
    
    // 重置当前工具状态
    currentTool.value = null;
    
    // 移除所有测量结果弹窗
    const popups = document.getElementsByClassName('mapboxgl-popup');
    // 从后往前移除，避免集合变化导致的问题
    for (let i = popups.length - 1; i >= 0; i--) {
      popups[i].remove();
    }
    
    // 如果有地图实例，切换回简单选择模式
    if (map.value && draw.value) {
      draw.value.changeMode('simple_select');
    }
    
    console.log('测量工具已清除');
  } catch (error) {
    console.error('清除测量失败:', error);
  }
};

// 添加分屏相关状态
const showBookViewer = ref(false);
const currentBook = ref<Book>({
  title: '',
  infoUrl: '',
  textUrl: '',
  imageUrl: '',
  url: ''
});

// 关闭书籍查看器
const closeBookViewer = () => {
  showBookViewer.value = false;
  emit('book-viewer-change', false);
  if (map.value) {
    setTimeout(() => {
      map.value?.resize();
    }, 300);
  }
};

// 添加状态控制
const showFileUpload = ref(false);
const showFilePagination = ref(false);
const showMap = ref(true);

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

// 在打开书籍查看器的地方添加事件发送
const showBookInfo = (e: any) => {
  // 确保有features并且至少有一个feature
  if (e.features?.length > 0) {
    const feature = e.features[0];
    const property = feature.properties?.name || feature.properties?.属性 || '板块信息';
    
    console.log(`点击区域属性: ${property}`);  // 打印点击的区域属性
    
    // 设置当前书籍信息
    currentBook.value = {
      title: property,
      infoUrl: '',  // 初始为空，稍后根据文件内容动态设置
      textUrl: '',
      imageUrl: '',
      url: ''
    };
    
    // 显示书籍查看器并发送事件
    showBookViewer.value = true;
    emit('book-viewer-change', true);
    
    // 调整地图大小以适应新的容器尺寸
    setTimeout(() => {
      map.value?.resize();
    }, 300);
    
    // 调用后端API获取文件数据
    getFilesByProperty(property);
  }
};

// 添加文件URL相关状态
const pdfUrl = ref('');
const mdUrl = ref('');
const imageUrl = ref('');
const imageList = ref<{url: string, title: string}[]>([]);
const markdownContent = ref('');
const currentPage = ref(1);
const totalPages = ref(0);
const currentImageIndex = ref(0); // 添加当前图片索引

// 在现有的ref变量声明附近添加
const rawMarkdownContent = ref('');
const isEditMode = ref(false);

// 在 script 部分添加图片预览相关状态
// 在现有的 ref 变量声明附近添加
const showImagePreview = ref(false);
const previewImageUrl = ref('');
const previewImageTitle = ref('');

// 添加处理 Markdown 内容的方法，使图片链接可点击
const processMarkdownImages = (content: string) => {
  if (!content) return '';
  
  // 使用 marked 渲染 Markdown
  let renderedContent = marked(content) as string;
  
  // 处理图片链接，添加点击事件
  renderedContent = renderedContent.replace(
    /<img src="([^"]+)" alt="([^"]*)">/g, 
    (match, src, alt) => {
      // 构建完整的图片 URL
      let fullSrc = src;
      if (!src.startsWith('http') && !src.startsWith('/')) {
        fullSrc = `http://localhost:8080${src.startsWith('/') ? '' : '/'}${src}`;
      }
      
      // 返回带有点击事件的图片标签
      return `<img src="${fullSrc}" alt="${alt}" class="clickable-image" data-src="${fullSrc}" data-title="${alt || '图片'}" onclick="window.previewImage('${fullSrc}', '${alt || '图片'}')">`;
    }
  );
  
  return renderedContent;
};

// 添加预览图片的方法
const previewImage = (url: string, title: string) => {
  previewImageUrl.value = url;
  previewImageTitle.value = title;
  showImagePreview.value = true;
};

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false;
  previewImageUrl.value = '';
  previewImageTitle.value = '';
};

// 获取文件数据并展示
const getFilesByProperty = async (property: string) => {
  try {
    // 清空图片列表和重置当前图片索引
    imageList.value = [];
    currentImageIndex.value = 0;
    
    // 获取文件列表
    const response = await axios.get<ApiResponse>(`http://localhost:8080/api/files/${property}`, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
    console.log(`从后端获取的文件数据:`, response.data);

    if (response.data && response.data.content && response.data.content.length > 0) {
      const files = response.data.content as FileInfo[]; // 获取文件基本信息
      console.log(`获取到的文件列表:`, files);

      // 按文件类型分类
      const categorizedFiles: {
        pdfFiles: FileInfo[];
        mdFiles: FileInfo[];
        imageFiles: FileInfo[];
      } = {
        pdfFiles: [],
        mdFiles: [],
        imageFiles: []
      };

      files.forEach(file => {
        const filePath = file.file_path?.toLowerCase() || '';
        if (filePath.endsWith('.pdf')) {
          categorizedFiles.pdfFiles.push(file);
        } else if (filePath.endsWith('.md')) {
          categorizedFiles.mdFiles.push(file);
        } else if (['.jpg', '.jpeg', '.png', '.gif'].some(ext => filePath.endsWith(ext))) {
          categorizedFiles.imageFiles.push(file);
        }
      });

      // 检查是否有图片文件
      if (response.data.images && response.data.images.length > 0) {
        response.data.images.forEach((image: any) => {
          if (image.file_path && ['.jpg', '.jpeg', '.png', '.gif'].some(ext => 
              image.file_path.toLowerCase().endsWith(ext))) {
            categorizedFiles.imageFiles.push(image);
          }
        });
      }

      console.log(`分类后的文件:`, categorizedFiles);

      // 获取每种类型的文件详细信息
      const [pdfDetails, mdDetails, imageDetails] = await Promise.all([ 
        getFilesDetailsByType(categorizedFiles.pdfFiles),
        getFilesDetailsByType(categorizedFiles.mdFiles),
        getFilesDetailsByType(categorizedFiles.imageFiles)
      ]);

      // 更新 URL
      if (pdfDetails && pdfDetails.length > 0) {
        pdfUrl.value = `http://localhost:8080${pdfDetails[0].file_path}`;
        console.log(`PDF 文件路径:`, pdfUrl.value);
      } else {
        pdfUrl.value = '';
      }
      
      if (mdDetails && mdDetails.length > 0) {
        mdUrl.value = `http://localhost:8080${mdDetails[0].file_path}`;
      } else {
        mdUrl.value = '';
      }
      
      // 处理图片文件
      if (imageDetails && imageDetails.length > 0) {
        // 如果有直接的图片文件，添加到图片列表
        imageDetails.forEach(img => {
          imageList.value.push({
            url: `http://localhost:8080${img.file_path}`,
            title: img.title || `图片 ${imageList.value.length + 1}`
          });
        });
      }
      
      // 尝试从章节图片文件夹获取更多图片
      try {
        const imgResponse = await axios.get<ChapterImagesResponse>(`http://localhost:8080/api/files/chapter/${property}/images`);
        if (imgResponse.data && imgResponse.data.images && imgResponse.data.images.length > 0) {
          // 将章节图片添加到图片列表
          imgResponse.data.images.forEach((img: any, index: number) => {
            imageList.value.push({
              url: `http://localhost:8080${img.url}`,
              title: img.title || `章节图片 ${index + 1}`
            });
          });
        }
      } catch (imgError) {
        console.error('获取章节图片失败:', imgError);
      }
      
      // 设置第一张图片为当前显示的图片
      if (imageList.value.length > 0) {
        imageUrl.value = imageList.value[0].url;
      } else {
        imageUrl.value = '';
      }

      loadContent();  // 根据新的文件路径加载文件
    } else {
      console.log('未找到相关文件');
      // 清空所有URL
      pdfUrl.value = '';
      mdUrl.value = '';
      imageUrl.value = '';
      markdownContent.value = '';
    }
  } catch (error) {
    console.error('获取文件失败:', error);
    ElMessage.error('获取文件数据失败，请检查网络连接');
    // 清空所有URL
    pdfUrl.value = '';
    mdUrl.value = '';
    imageUrl.value = '';
    markdownContent.value = '';
  }
};

// 获取每种类型文件的详细信息
const getFilesDetailsByType = async (files: FileInfo[]) => {
  if (files.length === 0) return null;

  console.log(`正在获取文件详细信息:`, files);

  // 并行请求每个文件的详细信息
  const details = await Promise.all(files.map(file => getFileDetailsById(file.id)));
  console.log(`获取到的文件详细信息:`, details);
  return details.filter(Boolean) as FileInfo[]; // 过滤掉null值
};

// 请求文件详细信息
const getFileDetailsById = async (fileId: string) => {
  try {
    const response = await axios.get<FileInfo>(`http://localhost:8080/api/files/details/${fileId}`, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
    console.log(`获取文件 ${fileId} 详细信息:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`获取文件 ${fileId} 详细信息失败:`, error);
    return null;
  }
};

// 切换 tab
const switchTab = (tab: string) => {
  activeTab.value = tab;
  loadContent();
};

// 图片导航方法
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
    updateCurrentImage();
  }
};

const nextImage = () => {
  if (currentImageIndex.value < imageList.value.length - 1) {
    currentImageIndex.value++;
    updateCurrentImage();
  }
};

const selectImage = (index: number) => {
  currentImageIndex.value = index;
  updateCurrentImage();
};

const updateCurrentImage = () => {
  if (imageList.value.length > 0 && currentImageIndex.value >= 0 && currentImageIndex.value < imageList.value.length) {
    imageUrl.value = imageList.value[currentImageIndex.value].url;
  }
};

// 加载内容
const loadContent = () => {
  if (activeTab.value === 'info') {
    if (pdfUrl.value) loadPdf(pdfUrl.value);
  } else if (activeTab.value === 'text') {
    if (mdUrl.value) loadMarkdown(mdUrl.value);
  } else if (activeTab.value === 'image') {
    // 确保当前图片索引有效
    if (imageList.value.length > 0) {
      if (currentImageIndex.value >= imageList.value.length) {
        currentImageIndex.value = 0;
      }
      updateCurrentImage();
    }
  }
};

// 加载 PDF 文件
const loadPdf = (url: string) => {
  if (!url) return;
  
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then((pdf) => {
    totalPages.value = pdf.numPages;
    renderPage(currentPage.value, pdf); // 渲染当前页

    // 监听滚轮事件进行翻页
    const pdfContainer = document.getElementById('pdf-container');
    if (pdfContainer) {
      pdfContainer.addEventListener('wheel', (event) => {
        if (event.deltaY > 0) {
          // 向下滚动，翻到下一页
          if (currentPage.value < totalPages.value) {
            currentPage.value++;
            renderPage(currentPage.value, pdf);
          }
        } else {
          // 向上滚动，翻到上一页
          if (currentPage.value > 1) {
            currentPage.value--;
            renderPage(currentPage.value, pdf);
          }
        }
      });
    }
  }).catch((error) => {
    console.error('Error loading PDF:', error);
    ElMessage.error('加载 PDF 失败');
  });
};

// 渲染页面
const renderPage = (pageNum: number, pdf: any) => {
  pdf.getPage(pageNum).then((page: any) => {
    const scale = 1.5; // 缩放比例
    const viewport = page.getViewport({ scale });

    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // 渲染当前页到 canvas
    page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise.then(() => {
      // 将 canvas 元素插入到容器中
      const pdfContainer = document.getElementById('pdf-container');
      if (pdfContainer) {
        pdfContainer.innerHTML = ''; // 清空之前的内容
        pdfContainer.appendChild(canvas);
      }
    });
  });
};

// 加载 Markdown 文件
const loadMarkdown = async (url: string) => {
  if (!url) return;
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      const mdContent = await response.text();
      rawMarkdownContent.value = mdContent; // 保存原始Markdown文本
      
      // 使用处理图片的方法渲染 Markdown
      markdownContent.value = processMarkdownImages(mdContent);
      
      // 添加全局方法，供图片点击事件调用
      window.previewImage = previewImage;
    } else {
      ElMessage.error('加载 Markdown 文件失败');
    }
  } catch (error) {
    console.error('加载 Markdown 失败', error);
    ElMessage.error('加载 Markdown 文件失败');
  }
};

// 添加切换编辑模式的方法
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    // 从编辑模式切换到预览模式时，更新渲染的内容
    markdownContent.value = processMarkdownImages(rawMarkdownContent.value);
  }
};

// 添加保存Markdown的方法
const saveMarkdown = async () => {
  try {
    // 这里可以添加保存到后端的逻辑
    // 例如：
    // await axios.post(`http://localhost:8080/api/files/update`, {
    //   property: currentBook.value.title,
    //   content: rawMarkdownContent.value
    // });
    
    // 更新显示内容
    markdownContent.value = processMarkdownImages(rawMarkdownContent.value);
    ElMessage.success('Markdown内容已保存');
    isEditMode.value = false; // 保存后切换到预览模式
  } catch (error) {
    console.error('保存Markdown失败', error);
    ElMessage.error('保存失败，请重试');
  }
};

// 添加表格相关状态
interface TableItem {
  name: string;
  path: string;
  url: string;
  size?: number;
  lastModified?: number;
}

const tableList = ref<TableItem[]>([]);
const currentTableIndex = ref(-1);
const currentTableUrl = ref('');
const tableLoading = ref(false);
const tableError = ref('');

// 获取表格数据
const fetchTableData = async () => {
  if (!currentBook.value.title) {
    tableError.value = '请先选择一个章节';
    return;
  }
  
  tableLoading.value = true;
  tableError.value = '';
  tableList.value = [];
  currentTableIndex.value = -1;
  currentTableUrl.value = '';
  
  try {
    // 尝试获取表格列表，使用章节标题加上"表"后缀
    const chapterProperty = currentBook.value.title.includes('表') 
      ? currentBook.value.title 
      : `${currentBook.value.title}表`;
    
    console.log(`尝试获取章节 ${chapterProperty} 的表格数据`);
    
    // 获取表格列表
    const response = await axios.get<{tables?: TableItem[], folder?: any, path?: string}>(
      `http://localhost:8080/api/files/chapter/${encodeURIComponent(chapterProperty)}/tables`
    );
    
    console.log('获取到的表格数据:', response.data);
    
    if (response.data && response.data.tables && response.data.tables.length > 0) {
      // 处理表格列表，确保URL是完整的
      tableList.value = response.data.tables.map(table => ({
        name: table.name || '未命名表格',
        path: table.path || '',
        url: table.url.startsWith('http') ? table.url : `http://localhost:8080${table.url}`,
        size: table.size || 0,
        lastModified: table.lastModified || Date.now()
      }));
      
      // 默认选择第一个表格
      if (tableList.value.length > 0) {
        selectTable(0);
      }
    } else {
      // 如果表格列表为空，尝试使用原始章节标题
      if (chapterProperty !== currentBook.value.title) {
        await tryFetchWithOriginalTitle();
      } else {
        tableError.value = '未找到表格数据';
      }
    }
  } catch (error) {
    console.error('获取表格数据失败:', error);
    // 尝试使用原始章节标题
    await tryFetchWithOriginalTitle();
  } finally {
    tableLoading.value = false;
  }
};

// 使用原始章节标题尝试获取表格
const tryFetchWithOriginalTitle = async () => {
  try {
    console.log(`尝试使用原始章节标题获取表格数据: ${currentBook.value.title}`);
    
    const response = await axios.get<{tables?: TableItem[], folder?: any, path?: string}>(
      `http://localhost:8080/api/files/chapter/${encodeURIComponent(currentBook.value.title)}/tables`
    );
    
    if (response.data && response.data.tables && response.data.tables.length > 0) {
      // 处理表格列表
      tableList.value = response.data.tables.map(table => ({
        name: table.name || '未命名表格',
        path: table.path || '',
        url: table.url.startsWith('http') ? table.url : `http://localhost:8080${table.url}`,
        size: table.size || 0,
        lastModified: table.lastModified || Date.now()
      }));
      
      // 默认选择第一个表格
      if (tableList.value.length > 0) {
        selectTable(0);
        return;
      }
    }
    
    tableError.value = '未找到表格数据';
  } catch (error) {
    console.error('使用原始章节标题获取表格失败:', error);
    tableError.value = '获取表格数据失败，请重试';
  }
};

// 选择表格
const selectTable = (index: number) => {
  if (index < 0 || index >= tableList.value.length) return;
  
  currentTableIndex.value = index;
  currentTableUrl.value = tableList.value[index].url;
};

// 下一个表格
const nextTable = () => {
  if (currentTableIndex.value < tableList.value.length - 1) {
    selectTable(currentTableIndex.value + 1);
  }
};

// 上一个表格
const prevTable = () => {
  if (currentTableIndex.value > 0) {
    selectTable(currentTableIndex.value - 1);
  }
};

// 在切换到表格标签时加载表格数据
watch(activeTab, (newTab) => {
  if (newTab === 'table' && tableList.value.length === 0 && !tableLoading.value) {
    fetchTableData();
  }
});

// 初始化地图
onMounted(() => {
  if (!mapContainer.value) return;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [118.7915619, 32.0615513],
    zoom: 3,
    preserveDrawingBuffer: true
  });

  // 创建一个标志，表示地图是否已经初始化
  let mapInitialized = false;

  // 使用setTimeout避免深度类型实例化问题
  setTimeout(() => {
    if (!map.value) return;
    
    // 确保load事件只绑定一次
    if (!mapInitialized) {
      map.value.on('load', () => {
        if (!map.value) return;
        
        console.log('地图加载完成，初始化绘图工具');
        
        // 初始化绘图工具
        draw.value = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            line_string: true,
            polygon: true,
            trash: true
          }
        });

        map.value.addControl(draw.value);

        // 添加事件监听
        map.value.on('draw.create', updateMeasurement);
        map.value.on('draw.update', updateMeasurement);
        map.value.on('draw.delete', clearMeasurements);

        // 添加地图移动事件监听
        map.value.on('move', () => {
          const measurementDiv = document.getElementById('measurement-result');
          if (measurementDiv && draw.value) {
            const features = draw.value.getAll().features;
            if (features && features.length > 0) {
              const feature = features[0];
              if (feature.geometry.type === 'Polygon') {
                const center = turf.center(feature);
                const coordinates = center.geometry.coordinates as [number, number];
                if (map.value) {
                  const point = map.value.project(coordinates);
                  measurementDiv.style.left = `${point.x + 10}px`;
                  measurementDiv.style.top = `${point.y - 30}px`;
                }
              } else if (feature.geometry.type === 'LineString') {
                const coordinates = feature.geometry.coordinates;
                const endPoint = coordinates[coordinates.length - 1] as [number, number];
                if (map.value) {
                  const point = map.value.project(endPoint);
                  measurementDiv.style.left = `${point.x + 10}px`;
                  measurementDiv.style.top = `${point.y - 30}px`;
                }
              }
            }
          }
        });
        
        // 设置标志，表示地图已初始化
        mapInitialized = true;
      });
    }
  }, 100);
});

// 暴露测量相关方法给父组件
defineExpose({
  toggleLayer,
  addLayer,
  removeLayer,
  clearAllLayers,
  changeBasemap,
  resetView,
  toggleMeasurement,
  clearMeasurements,
  // 添加检查图层是否存在的方法
  hasLayer: (layerName: string) => {
    if (!map.value) return false;
    return !!map.value.getLayer(layerName);
  }
});

const showPlateManager = computed(() => props.showPlateManager ?? false);
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 分屏布局样式 */
.split-container {
  display: flex;
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 左侧地图区域样式 */
.map-section {
  position: relative;
  flex: 1;
  transition: all 0.3s ease;
  width: 100%;
  height: 100vh;
  overflow: visible;
}

.map-section.map-shrink {
  width: 60%;
  flex: 0 0 60%;
}

/* 右侧书籍查看器样式 */
.book-viewer {
  position: absolute;
  right: 0;
  top: 0;
  width: 40%;
  height: 100%;
  background: #2c3e50; /* 修改为暗色背景 */
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 1000;
  color: #e0e0e0; /* 添加亮色文本 */
}

.book-viewer.viewer-show {
  transform: translateX(0);
}

.viewer-header {
  padding: 16px;
  border-bottom: 1px solid #3a4d61; /* 更改边框颜色 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #243342; /* 更深的背景色 */
}

.viewer-header h3 {
  color: #ffffff; /* 标题文字颜色 */
}

.close-viewer {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  color: #b0bec5; /* 更改关闭按钮颜色 */
}

.close-viewer:hover {
  color: #ffffff;
}

/* 地图控件样式 */
.map-controls-group {
  position: absolute;
  top: 10px;
  right: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.map-control-icon, .reset-view-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  border: 1px solid #e4e7ed;
}

.map-control-icon:hover, .reset-view-icon:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
  transform: translateY(-1px);
}

.map-control-icon.active {
  background: #409eff;
  border-color: #409eff;
  color: #ffffff;
}

.map-control-icon svg, .reset-view-icon svg {
  width: 20px;
  height: 20px;
}

/* 分屏模式下的位置调整 */
.split-active .map-controls-group {
  right: calc(42% + 120px); /* 在分屏模式下保持相对位置 */
}

/* 地图容器样式调整 */
#map {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #f0f0f0;
}

/* 分屏布局样式调整 */
.split-container {
  display: flex;
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
}

.map-section {
  flex: 1;
  height: 100%;
  position: relative;
  transition: all 0.3s ease;
}

.map-section.map-shrink {
  flex: 0 0 60%;
}

/* 书籍查看器样式调整 */
.book-viewer {
  position: absolute;
  right: 0;
  top: 0;
  width: 40%;
  height: 100%;
  background: #2c3e50; /* 修改为暗色背景 */
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 1000;
  color: #e0e0e0; /* 添加亮色文本 */
}

.book-viewer.viewer-show {
  transform: translateX(0);
}

.viewer-header {
  padding: 16px;
  border-bottom: 1px solid #3a4d61; /* 更改边框颜色 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #243342; /* 更深的背景色 */
}

.viewer-header h3 {
  color: #ffffff; /* 标题文字颜色 */
}

.close-viewer {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  color: #b0bec5; /* 更改关闭按钮颜色 */
}

.close-viewer:hover {
  color: #ffffff;
}

.viewer-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px); /* 减去header的高度 */
  background: #2c3e50; /* 匹配主背景色 */
}

.content-tabs {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #3a4d61; /* 更改边框颜色 */
  background: #243342; /* 更深的背景色 */
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #b0bec5; /* 更改按钮文字颜色 */
  transition: all 0.3s ease;
  font-size: 14px;
}

.tab-btn:hover {
  background: #34495e;
  color: #64b5f6; /* 更改悬停颜色 */
}

.tab-btn.active {
  background: #34495e; /* 更改激活背景 */
  color: #64b5f6; /* 更改激活颜色 */
  font-weight: 500;
}

.tab-icon {
  font-size: 16px;
}

.content-display {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #2c3e50; /* 匹配主背景色 */
}

.content-section {
  background: #34495e; /* 更深的背景色 */
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #3a4d61; /* 更改边框颜色 */
}

.content-placeholder {
  text-align: center;
  padding: 20px;
  color: #b0bec5; /* 更改文字颜色 */
}

.content-placeholder h3 {
  margin-bottom: 16px;
  color: #ffffff; /* 更改标题颜色 */
  font-size: 18px;
}

.content-placeholder p {
  color: #b0bec5; /* 更改文字颜色 */
  margin-bottom: 20px;
  font-size: 14px;
}

.placeholder-content {
  background: #243342; /* 更深的背景色 */
  border-radius: 8px;
  padding: 20px;
  text-align: left;
}

.placeholder-content ul {
  list-style: none;
  padding: 0;
  margin: 16px 0 0 0;
}

.placeholder-content li {
  padding: 8px 0;
  color: #b0bec5; /* 更改文字颜色 */
  border-bottom: 1px dashed #e4e7ed;
  font-size: 14px;
}

.placeholder-content li:last-child {
  border-bottom: none;
}

.image-placeholder {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.placeholder-icon {
  font-size: 48px;
  color: #909399;
}

.table-display {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.table-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.action-btn:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
  color: #409eff;
}

.table-content {
  min-height: 200px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.table-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f5f7fa;
  border-radius: 8px;
  gap: 16px;
  height: 100%;
}

.table-placeholder .note {
  color: #909399;
  font-size: 14px;
}

/* PDF容器样式 */
.pdf-container {
  width: 100%;
  min-height: 400px;
  background: #34495e; /* 更深的背景色 */
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  overflow: auto;
}

.pdf-container canvas {
  display: block;
  margin: 0 auto;
  max-width: 100%;
}

/* Markdown编辑器样式 */
.markdown-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.markdown-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #3a4d61; /* 更改边框颜色 */
  margin-bottom: 16px;
}

.toolbar-btn {
  padding: 6px 12px;
  background: #243342; /* 更深的背景色 */
  border: 1px solid #3a4d61; /* 更改边框颜色 */
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #b0bec5; /* 更改文字颜色 */
  transition: all 0.3s;
}

.toolbar-btn:hover {
  background: #34495e;
  color: #64b5f6; /* 更改悬停颜色 */
  border-color: #64b5f6;
}

.markdown-editor {
  flex: 1;
  min-height: 500px; /* 增加编辑框高度 */
}

.markdown-textarea {
  width: 100%;
  height: 100%;
  min-height: 500px; /* 增加编辑框高度 */
  padding: 16px;
  border: 1px solid #3a4d61; /* 更改边框颜色 */
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 15px; /* 增大字体 */
  line-height: 1.6;
  color: #e0e0e0; /* 更改文字颜色 */
  background: #243342; /* 更深的背景色 */
  resize: vertical;
}

.markdown-textarea:focus {
  outline: none;
  border-color: #64b5f6; /* 更改焦点边框颜色 */
  box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.2);
}

/* 增强Markdown内容的样式 */
.markdown-content {
  padding: 20px;
  background: #34495e; /* 更深的背景色 */
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  line-height: 1.6;
  color: #e0e0e0; /* 更改文字颜色 */
  overflow-wrap: break-word;
  min-height: 500px; /* 增加内容区高度 */
}

.markdown-content h1 {
  font-size: 28px;
  border-bottom: 1px solid #3a4d61; /* 更改边框颜色 */
  padding-bottom: 0.3em;
  margin-top: 24px;
  margin-bottom: 16px;
  color: #ffffff; /* 更改标题颜色 */
}

.markdown-content h2 {
  font-size: 24px;
  border-bottom: 1px solid #3a4d61; /* 更改边框颜色 */
  padding-bottom: 0.3em;
  margin-top: 24px;
  margin-bottom: 16px;
  color: #ffffff; /* 更改标题颜色 */
}

.markdown-content h3 {
  font-size: 20px;
  margin-top: 24px;
  margin-bottom: 16px;
  color: #ffffff; /* 更改标题颜色 */
}

.markdown-content h4 {
  font-size: 18px;
  margin-top: 24px;
  margin-bottom: 16px;
  color: #ffffff; /* 更改标题颜色 */
}

.markdown-content p {
  margin-bottom: 16px;
}

.markdown-content a {
  color: #64b5f6; /* 更改链接颜色 */
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content blockquote {
  padding: 0 1em;
  color: #b0bec5; /* 更改引用颜色 */
  border-left: 0.25em solid #3a4d61; /* 更改边框颜色 */
  margin: 0 0 16px 0;
}

.markdown-content pre {
  background-color: #243342; /* 更深的背景色 */
  border-radius: 3px;
  padding: 16px;
  overflow: auto;
  margin-bottom: 16px;
}

.markdown-content code {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 85%;
  padding: 0.2em 0.4em;
  color: #64b5f6; /* 更改代码颜色 */
}

.markdown-content img {
  max-width: 100%;
  box-sizing: content-box;
  background-color: #fff;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-content table th,
.markdown-content table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-content table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.markdown-content table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

/* 图片容器样式 */
.image-container {
  width: 100%;
  padding: 20px;
  background: #34495e; /* 更深的背景色 */
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.plate-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 4px;
}

.image-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.image-counter {
  font-size: 14px;
  color: #b0bec5; /* 更改文字颜色 */
}

.image-nav-buttons {
  display: flex;
  gap: 8px;
}

.nav-btn {
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  color: #b0bec5; /* 更改按钮颜色 */
  transition: all 0.3s ease;
}

.nav-btn:hover {
  color: #64b5f6; /* 更改悬停颜色 */
}

.nav-btn.prev-btn {
  border-right: 1px solid #3a4d61; /* 更改边框颜色 */
}

.nav-btn.next-btn {
  border-left: 1px solid #3a4d61; /* 更改边框颜色 */
}

.nav-btn:disabled {
  color: #546e7a; /* 更改禁用颜色 */
  cursor: not-allowed;
}

.image-title {
  margin-top: 10px;
  font-size: 14px;
  color: #b0bec5; /* 更改文字颜色 */
}

.image-thumbnails {
  display: flex;
  flex-wrap: wrap; /* 允许缩略图换行 */
  justify-content: center;
  gap: 10px; /* 使用gap替代margin */
  margin-top: 20px;
}

.thumbnail-item {
  width: 80px;
  height: 80px;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.thumbnail-item:hover {
  transform: scale(1.05);
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-item.active {
  border: 2px solid #64b5f6; /* 更改激活边框颜色 */
}

/* 表格图片容器样式 */
.table-image-container {
  width: 100%;
  padding: 20px;
  background: #34495e; /* 更深的背景色 */
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 4px;
  margin: 0 auto;
  object-fit: contain;
}

.table-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.table-counter {
  font-size: 14px;
  color: #b0bec5; /* 更改文字颜色 */
}

.table-nav-buttons {
  display: flex;
  gap: 8px;
}

.table-title {
  margin-top: 10px;
  font-size: 14px;
  color: #b0bec5; /* 更改文字颜色 */
}

.sidebar-plate-manager {
  position: absolute;
  top: 0;
  right: 0;
  width: 380px;
  height: 100%;
  z-index: 2000;
  background: #2c3e50;
  box-shadow: -2px 0 10px rgba(0,0,0,0.2);
  transition: right 0.3s;
}
</style>