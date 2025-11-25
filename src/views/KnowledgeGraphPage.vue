<template>
  <div class="knowledge-graph-container">
    <!-- 顶部工具栏 -->
    <div class="graph-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="icon">←</span>
          返回书籍列表
        </button>
        <div class="book-info">
          <h2>{{ bookTitle || '知识图谱' }}</h2>
          <span class="subtitle">Markdown 可视化</span>
        </div>
      </div>
      <div class="header-right">
        <button class="tool-btn" @click="showUploadModal = true" title="上传文件">📁</button>
        <button class="tool-btn" @click="resetView" title="重置视图">🔄</button>
        <button class="tool-btn" @click="exportGraph" title="导出图谱">📥</button>
        <button class="tool-btn" @click="toggleFullscreen" title="全屏">⛶</button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="graph-content">
      <!-- 左侧控制面板 -->
      <div class="control-panel" :class="{ collapsed: isPanelCollapsed }">
        <div class="panel-header">
          <h3 v-if="!isPanelCollapsed">控制面板</h3>
          <button class="collapse-btn" @click="togglePanel">
            {{ isPanelCollapsed ? '►' : '◄' }}
          </button>
        </div>
        
        <div class="panel-content" v-if="!isPanelCollapsed">
          <!-- 文件信息 -->
          <div class="stats-section" v-if="currentFileName">
            <h4>文件信息</h4>
            <div class="stat-item">
              <span class="stat-label">文件名:</span>
              <span class="stat-value small">{{ currentFileName }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">字数:</span>
              <span class="stat-value">{{ textStats.wordCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">标题数:</span>
              <span class="stat-value">{{ textStats.headingCount }}</span>
            </div>
          </div>

          <!-- 图谱统计 -->
          <div class="stats-section">
            <h4>图谱统计</h4>
            <div class="stat-item">
              <span class="stat-label">节点数量:</span>
              <span class="stat-value">{{ graphData?.nodes.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">关系数量:</span>
              <span class="stat-value">{{ graphData?.edges.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">类别数:</span>
              <span class="stat-value">{{ graphData?.categories.length || 0 }}</span>
            </div>
          </div>

          <!-- 布局选项 -->
          <div class="layout-section">
            <h4>布局算法</h4>
            <select v-model="selectedLayout" class="layout-select">
              <option value="force">力导向布局</option>
              <option value="circular">环形布局</option>
            </select>
          </div>

          <!-- 操作按钮 -->
          <div class="action-section">
            <button class="action-btn primary" @click="showUploadModal = true">
              📁 上传新文件
            </button>
            <button class="action-btn" @click="regenerateGraph" v-if="markdownContent">
              🔄 重新生成
            </button>
          </div>
        </div>
      </div>

      <!-- 图谱可视化区域 -->
      <div class="graph-canvas">
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>正在构建知识图谱...</p>
        </div>
        
        <div v-else-if="!graphData" class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>还没有上传 Markdown 文件</h3>
          <p>点击右上角的 📁 按钮上传文件，开始构建知识图谱</p>
          <button class="upload-btn" @click="showUploadModal = true">
            上传 Markdown 文件
          </button>
        </div>

        <GraphVisualization 
          v-else
          :graphData="graphData" 
          :layout="selectedLayout"
          @nodeClick="handleNodeClick"
          ref="graphViz"
        />
      </div>
    </div>

    <!-- 上传弹窗 -->
    <div class="modal" v-if="showUploadModal">
      <div class="modal-overlay" @click="showUploadModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>上传 Markdown 文件</h3>
          <button class="close-btn" @click="showUploadModal = false">×</button>
        </div>
        <div class="modal-body">
          <MarkdownUploader @fileLoaded="handleFileLoaded" />
        </div>
      </div>
    </div>

    <!-- 节点详情弹窗 -->
    <div class="node-detail-modal" v-if="selectedNode">
      <div class="modal-overlay" @click="selectedNode = null"></div>
      <div class="modal-content small">
        <div class="modal-header">
          <h3>{{ selectedNode.name }}</h3>
          <button class="close-btn" @click="selectedNode = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <span class="label">类型:</span>
            <span class="value">{{ selectedNode.type }}</span>
          </div>
          <div class="detail-item">
            <span class="label">连接数:</span>
            <span class="value">{{ selectedNode.value }}</span>
          </div>
          <div class="detail-item" v-if="selectedNode.description">
            <span class="label">描述:</span>
            <span class="value">{{ selectedNode.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MarkdownUploader from '../components/MarkdownUploader.vue';
import GraphVisualization from '../components/GraphVisualization.vue';
import { KnowledgeExtractor, type GraphData } from '../utils/knowledgeExtractor';

const router = useRouter();
const route = useRoute();

const bookTitle = ref(route.query.title as string || '');
const isPanelCollapsed = ref(false);
const isLoading = ref(false);
const showUploadModal = ref(false);
const selectedLayout = ref('force');
const graphData = ref<GraphData | null>(null);
const markdownContent = ref('');
const currentFileName = ref('');
const selectedNode = ref<any>(null);
const graphViz = ref<any>(null);

const textStats = ref({
  wordCount: 0,
  headingCount: 0,
  paragraphCount: 0,
});

const goBack = () => {
  router.push('/books');
};

const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value;
  setTimeout(() => {
    graphViz.value?.resize();
  }, 300);
};

const resetView = () => {
  graphViz.value?.resize();
};

const exportGraph = () => {
  if (!graphData.value) {
    alert('请先上传文件生成图谱');
    return;
  }
  
  const dataStr = JSON.stringify(graphData.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `知识图谱_${currentFileName.value || 'graph'}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

const handleFileLoaded = async (content: string, fileName: string) => {
  markdownContent.value = content;
  currentFileName.value = fileName;
  showUploadModal.value = false;
  
  await generateGraph();
};

const generateGraph = async () => {
  if (!markdownContent.value) return;
  
  isLoading.value = true;
  
  try {
    // 模拟异步处理
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const extractor = new KnowledgeExtractor();
    graphData.value = extractor.parseMarkdown(markdownContent.value);
    
    textStats.value = KnowledgeExtractor.analyzeText(markdownContent.value);
    
    console.log('生成的图谱数据:', graphData.value);
  } catch (error) {
    console.error('生成图谱失败:', error);
    alert('生成图谱失败，请检查文件格式');
  } finally {
    isLoading.value = false;
  }
};

const regenerateGraph = () => {
  generateGraph();
};

const handleNodeClick = (nodeData: any) => {
  selectedNode.value = nodeData;
};

onMounted(() => {
  // 如果没有通过路由传递书籍信息，显示上传弹窗
  if (!bookTitle.value) {
    setTimeout(() => {
      showUploadModal.value = true;
    }, 500);
  }
});
</script>

<style scoped>
.knowledge-graph-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  color: #ffffff;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-bottom: 2px solid #3498db;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 1px solid #3498db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #3498db;
  color: white;
}

.book-info h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  font-size: 14px;
  color: #95a5a6;
  margin-left: 10px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.tool-btn {
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s ease;
}

.tool-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.graph-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.control-panel {
  width: 300px;
  background-color: #2c3e50;
  border-right: 2px solid #34495e;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow-y: auto;
}

.control-panel.collapsed {
  width: 50px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #34495e;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.collapse-btn {
  background: none;
  border: none;
  color: #3498db;
  font-size: 18px;
  cursor: pointer;
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
}

.stats-section {
  margin-bottom: 25px;
  padding: 15px;
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(52, 152, 219, 0.3);
}

.stats-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #3498db;
  text-transform: uppercase;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  gap: 10px;
}

.stat-label {
  color: #95a5a6;
  flex-shrink: 0;
}

.stat-value {
  color: #ffffff;
  font-weight: 600;
  text-align: right;
}

.stat-value.small {
  font-size: 12px;
  word-break: break-all;
}

.layout-section {
  margin-bottom: 25px;
}

.layout-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #3498db;
  text-transform: uppercase;
}

.layout-select {
  width: 100%;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  padding: 10px 15px;
  background-color: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 1px solid #3498db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background-color: #3498db;
  color: white;
}

.action-btn.primary {
  background-color: #3498db;
  color: white;
}

.graph-canvas {
  flex: 1;
  position: relative;
  background: radial-gradient(circle at center, #1e2a3a 0%, #0f1419 100%);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(52, 152, 219, 0.3);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 20px;
  color: #3498db;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 24px;
  color: #3498db;
  margin-bottom: 15px;
}

.empty-state p {
  color: #95a5a6;
  margin-bottom: 30px;
}

.upload-btn {
  padding: 12px 30px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-btn:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
}

.modal-content {
  position: relative;
  background-color: #2c3e50;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

.modal-content.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #34495e;
  border-bottom: 1px solid #3498db;
}

.modal-header h3 {
  margin: 0;
  color: #ffffff;
}

.close-btn {
  background: none;
  border: none;
  color: #95a5a6;
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.close-btn:hover {
  color: #ffffff;
}

.modal-body {
  padding: 30px;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item .label {
  display: block;
  font-size: 12px;
  color: #3498db;
  margin-bottom: 5px;
  text-transform: uppercase;
}

.detail-item .value {
  display: block;
  font-size: 14px;
  color: #ecf0f1;
}
</style>
