<template>
  <div class="hierarchical-page">
    <header class="top-header">
      <div class="header-container">
        <button class="back-button" @click="goBack">← 返回</button>
        <h1 class="page-title">书籍知识图谱</h1>
        <div class="header-actions">
          <button class="action-btn" @click="editMode = !editMode">
            {{ editMode ? '✓ 完成' : '✏️ 编辑' }}
          </button>
          <button class="action-btn" @click="saveGraph">💾 保存</button>
        </div>
      </div>
    </header>

    <div class="main-content">
      <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '►' : '◄' }}
        </button>
        
        <div class="sidebar-content" v-if="!sidebarCollapsed">
          <div class="section">
            <h3>图谱控制</h3>
            <button @click="resetGraph">🔄 重置</button>
            <button @click="expandAll">📖 展开</button>
            <button @click="collapseAll">📕 收起</button>
          </div>

          <div class="section">
            <h3>统计</h3>
            <div class="stats">
              <div class="stat"><span>{{ totalNodes }}</span><label>节点</label></div>
              <div class="stat"><span>{{ totalLinks }}</span><label>连接</label></div>
              <div class="stat"><span>{{ booksData.length }}</span><label>书籍</label></div>
            </div>
          </div>

          <div class="section">
            <h3>图例</h3>
            <div class="legend">
              <div v-for="type in nodeTypes" :key="type.name">
                <span class="dot" :style="{ background: type.color }"></span>
                {{ type.name }}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="graph-container">
        <div class="canvas" ref="chartContainer"></div>
        <div class="edit-hint" v-if="editMode">✏️ 编辑模式 - 右键节点操作</div>
        <div class="loading-hint" v-if="loadingData">⏳ 正在加载图表数据...</div>
      </div>
    </div>

    <!-- 问答界面 -->
    <div class="qa-section">
      <KnowledgeQA :graphData="flattenedNodes" @jumpToNode="handleJumpToNode" />
    </div>

    <div class="context-menu" v-if="contextMenu.show" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
      <div @click="addChildNode">➕ 添加子节点</div>
      <div @click="editNode">✏️ 编辑</div>
      <div @click="deleteNode" v-if="contextMenu.node?.level !== 1">🗑️ 删除</div>
    </div>

    <div class="modal" v-if="editDialog.show" @click="closeEditDialog">
      <div class="dialog" @click.stop>
        <h3>{{ editDialog.mode === 'add' ? '添加节点' : '编辑节点' }}</h3>
        <input v-model="editDialog.name" placeholder="节点名称">
        <select v-model="editDialog.category">
          <option v-for="t in availableTypes" :key="t">{{ t }}</option>
        </select>
        <textarea v-model="editDialog.description" placeholder="描述（可选）"></textarea>
        <div class="actions">
          <button @click="closeEditDialog">取消</button>
          <button @click="saveEditDialog" class="primary">保存</button>
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <div class="modal preview-modal" v-if="previewModal.show" @click="closePreview">
      <div class="preview-dialog" @click.stop>
        <div class="preview-header">
          <h3>{{ previewModal.fileName }}</h3>
          <button class="close-btn" @click="closePreview">✕</button>
        </div>
        <div class="preview-content">
          <!-- 图片预览 -->
          <img v-if="previewModal.type === 'image'" 
               :src="previewModal.url" 
               :alt="previewModal.fileName"
               style="max-width: 100%; max-height: 80vh; object-fit: contain;" />
          
          <!-- 表格预览（表格实际上也是图片） -->
          <img v-else-if="previewModal.type === 'table'" 
               :src="previewModal.url" 
               :alt="previewModal.fileName"
               style="max-width: 100%; max-height: 80vh; object-fit: contain;" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import KnowledgeQA from '../components/KnowledgeQA.vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import fileApi from '../api/fileApi';

const router = useRouter();

interface GraphNode {
  id: string;
  name: string;
  category: string;
  level: number;
  symbolSize: number;
  description?: string;
  children?: GraphNode[];
  collapsed?: boolean;
  coverUrl?: string;
  bookId?: number; // 关联的书籍ID
  loaded?: boolean; // 标记节点是否已加载数据
  fileId?: number; // 文件ID，用于预览
  fileUrl?: string; // 文件URL，用于预览
  fileType?: string; // 文件类型
  property?: string; // 章节属性
}

const chartContainer = ref<HTMLElement | null>(null);
const sidebarCollapsed = ref(false);
const editMode = ref(false);
let chart: echarts.ECharts | null = null;

const contextMenu = ref({ show: false, x: 0, y: 0, node: null as GraphNode | null });
const editDialog = ref({ show: false, mode: 'add' as 'add' | 'edit', name: '', category: '章节', description: '', targetNode: null as GraphNode | null });

// 预览相关
const previewModal = ref({
  show: false,
  type: '', // 'image', 'table', 'pdf', 'markdown'
  url: '',
  fileName: '',
  fileId: null as number | null
});

const nodeTypes = [
  { name: '书籍', color: '#667eea' },
  { name: '目录', color: '#48bb78' },
  { name: '图片', color: '#38b2ac' },
  { name: '表格', color: '#ed64a6' },
  { name: '引文', color: '#f56565' },
  { name: 'article', color: '#4299e1' },
  { name: 'PDF', color: '#e53e3e' },
  { name: 'Markdown', color: '#38a169' },
  { name: '图片文件', color: '#319795' },
  { name: '表格文件', color: '#d53f8c' }
];

const availableTypes = computed(() => {
  if (!contextMenu.value.node) return ['目录'];
  const level = contextMenu.value.node.level;
  if (level === 1) return ['目录', '图片', '表格', '引文', 'article'];
  if (level === 2) {
    const cat = contextMenu.value.node.category;
    if (cat === '图片') return ['图片文件'];
    if (cat === '表格') return ['表格文件'];
    if (cat === 'article') return ['PDF', 'Markdown'];
  }
  return ['目录'];
});

// 图片和表格加载状态
const loadingData = ref(false);

// 动态加载图片节点
const loadImages = async (imagesNode: GraphNode) => {
  if (loadingData.value) return;
  
  const bookNode = findParentBook(imagesNode);
  if (!bookNode || !bookNode.bookId) {
    ElMessage.warning('无法获取书籍ID');
    return;
  }
  
  loadingData.value = true;
  try {
    console.log('📥 加载书籍的图片:', bookNode.bookId);
    
    // 1. 获取图片文件夹列表
    const folderSearchResult = await fileApi.searchFiles({
      keyword: '',
      fileType: 'img_folder',
      bookId: bookNode.bookId,
      page: 1,
      size: 100
    });
    
    // 清空现有children
    imagesNode.children = [];
    
    const folders = folderSearchResult.files || [];
    console.log('找到图片文件夹:', folders);
    
    // 2. 对每个文件夹，获取其中的图片
    for (const folder of folders) {
      const property = folder.property as string;
      if (!property) continue;
      
      try {
        // 使用正确的API: /api/files/chapter/{property}/images
        const folderData = await fileApi.getImageFolder(property, bookNode.bookId);
        const images = folderData.images || [];
        
        images.forEach((img: any, index: number) => {
          imagesNode.children!.push({
            id: `${imagesNode.id}_${property}_${index}`,
            name: img.name || `图片${index + 1}`,
            category: '图片文件',
            level: 3,
            symbolSize: 24,
            fileUrl: img.url,
            property: property,
            description: `来自章节: ${property}`
          });
        });
      } catch (error: any) {
        console.warn(`加载文件夹 ${property} 的图片失败:`, error);
      }
    }
    
    imagesNode.loaded = true;
    console.log(`✅ 图片加载完成: ${imagesNode.children?.length || 0} 张`);
    ElMessage.success(`加载完成: ${imagesNode.children?.length || 0} 张图片`);
    
    imagesNode.collapsed = false;
    rebuildGraph();
    
  } catch (error: any) {
    console.error('❌ 加载图片失败:', error);
    ElMessage.error(`加载失败: ${error.message || '未知错误'}`);
  } finally {
    loadingData.value = false;
  }
};

// 动态加载表格节点
const loadTables = async (tablesNode: GraphNode) => {
  if (loadingData.value) return;
  
  const bookNode = findParentBook(tablesNode);
  if (!bookNode || !bookNode.bookId) {
    ElMessage.warning('无法获取书籍ID');
    return;
  }
  
  loadingData.value = true;
  try {
    console.log('📥 加载书籍的表格:', bookNode.bookId);
    
    // 1. 获取表格文件夹列表
    const folderSearchResult = await fileApi.searchFiles({
      keyword: '',
      fileType: 'table_folder',
      bookId: bookNode.bookId,
      page: 1,
      size: 100
    });
    
    // 清空现有children
    tablesNode.children = [];
    
    const folders = folderSearchResult.files || [];
    console.log('找到表格文件夹:', folders);
    
    // 2. 对每个文件夹，获取其中的表格
    for (const folder of folders) {
      const property = folder.property as string;
      if (!property) continue;
      
      try {
        // 使用正确的API: /api/files/chapter/{property}/tables
        const folderData = await fileApi.getTableFolder(property, bookNode.bookId);
        const tables = folderData.tables || [];
        
        tables.forEach((table: any, index: number) => {
          tablesNode.children!.push({
            id: `${tablesNode.id}_${property}_${index}`,
            name: table.name || `表格${index + 1}`,
            category: '表格文件',
            level: 3,
            symbolSize: 24,
            fileUrl: table.url,
            property: property,
            description: `来自章节: ${property}`
          });
        });
      } catch (error: any) {
        console.warn(`加载文件夹 ${property} 的表格失败:`, error);
      }
    }
    
    tablesNode.loaded = true;
    console.log(`✅ 表格加载完成: ${tablesNode.children?.length || 0} 个`);
    ElMessage.success(`加载完成: ${tablesNode.children?.length || 0} 个表格`);
    
    tablesNode.collapsed = false;
    rebuildGraph();
    
  } catch (error: any) {
    console.error('❌ 加载表格失败:', error);
    ElMessage.error(`加载失败: ${error.message || '未知错误'}`);
  } finally {
    loadingData.value = false;
  }
};

// 动态加载article节点（PDF和Markdown）
const loadArticles = async (articlesNode: GraphNode) => {
  if (loadingData.value) return;
  
  const bookNode = findParentBook(articlesNode);
  if (!bookNode || !bookNode.bookId) {
    ElMessage.warning('无法获取书籍ID');
    return;
  }
  
  loadingData.value = true;
  try {
    console.log('📥 加载书籍的文章:', bookNode.bookId);
    
    // 使用搜索接口获取文章列表（fileType=article）
    const searchResult = await fileApi.searchFiles({
      keyword: '',
      fileType: 'article',  // 重要：指定文件类型为article
      bookId: bookNode.bookId,
      page: 1,
      size: 100
    });
    
    // 清空现有children
    articlesNode.children = [];
    
    const files = searchResult.files || [];
    console.log('找到文章:', files);
    
    files.forEach((file: any, index: number) => {
      const fileType = file.fileType?.toUpperCase() || 'PDF';
      articlesNode.children!.push({
        id: `${articlesNode.id}_${file.id}`,
        name: file.fileName || `文章${index + 1}`,
        category: fileType === 'MD' ? 'Markdown' : 'PDF',
        level: 3,
        symbolSize: 24,
        fileId: file.id,
        property: file.property,
        description: file.summary || file.property || ''
      });
    });
    
    articlesNode.loaded = true;
    console.log(`✅ 文章加载完成: ${articlesNode.children?.length || 0} 篇`);
    ElMessage.success(`加载完成: ${articlesNode.children?.length || 0} 篇文章`);
    
    articlesNode.collapsed = false;
    rebuildGraph();
    
  } catch (error: any) {
    console.error('❌ 加载文章失败:', error);
    ElMessage.error(`加载失败: ${error.message || '未知错误'}`);
  } finally {
    loadingData.value = false;
  }
};

// 查找节点的父级书籍节点
const findParentBook = (node: GraphNode): GraphNode | null => {
  const find = (nodes: GraphNode[], targetId: string, parent?: GraphNode): GraphNode | null => {
    for (const n of nodes) {
      if (n.id === targetId) {
        return parent?.category === '书籍' ? parent : null;
      }
      if (n.children) {
        const found = find(n.children, targetId, n);
        if (found) return found;
      }
    }
    return null;
  };
  return find(booksData, node.id);
};

// 预览文件
const previewFile = (node: GraphNode) => {
  console.log('预览文件:', node);
  
  if (node.category === '图片文件') {
    previewModal.value = {
      show: true,
      type: 'image',
      url: node.fileUrl || '',
      fileName: node.name,
      fileId: null
    };
  } else if (node.category === '表格文件') {
    previewModal.value = {
      show: true,
      type: 'table',
      url: node.fileUrl || '',
      fileName: node.name,
      fileId: null
    };
  } else if (node.category === 'PDF' || node.category === 'Markdown') {
    // 跳转到文件查看器页面
    if (node.fileId) {
      router.push({
        path: '/book-viewer',
        query: {
          fileId: node.fileId.toString(),
          fileName: node.name,
          property: node.property || ''
        }
      });
    }
  }
};

// 关闭预览
const closePreview = () => {
  previewModal.value.show = false;
};

const booksData: GraphNode[] = [
  {
    id: 'book1', 
    name: '板块构造与地貌形迹', 
    category: '书籍', 
    level: 1, 
    symbolSize: 80, 
    collapsed: true,
    coverUrl: '/images/板块构造与地貌形迹.jpg',
    bookId: 1,
    children: [
      { id: 'book1_catalog', name: '目录', category: '目录', level: 2, symbolSize: 45, collapsed: true, children: [] },
      { id: 'book1_images', name: '图片', category: '图片', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] },
      { id: 'book1_tables', name: '表格', category: '表格', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] },
      { id: 'book1_citations', name: '引文', category: '引文', level: 2, symbolSize: 45, collapsed: true, children: [] },
      { id: 'book1_articles', name: 'article', category: 'article', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] }
    ]
  },
  {
    id: 'book2', 
    name: '亚洲地貌圈及其板块造貌构造纲要', 
    category: '书籍', 
    level: 1, 
    symbolSize: 80, 
    collapsed: true,
    coverUrl: '/images/亚洲地貌圈及其板块造貌构造纲要.jpg',
    bookId: 2,
    children: [
      { id: 'book2_catalog', name: '目录', category: '目录', level: 2, symbolSize: 45, collapsed: true, children: [] },
      { id: 'book2_images', name: '图片', category: '图片', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] },
      { id: 'book2_tables', name: '表格', category: '表格', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] },
      { id: 'book2_citations', name: '引文', category: '引文', level: 2, symbolSize: 45, collapsed: true, children: [] },
      { id: 'book2_articles', name: 'article', category: 'article', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] }
    ]
  },
  {
    id: 'book3', 
    name: '地学新两论', 
    category: '书籍', 
    level: 1, 
    symbolSize: 80, 
    collapsed: true,
    coverUrl: '/images/地学新两论 上篇 板块造貌构造学-兼论板块学说新发展.jpg',
    bookId: 3,
    children: [
      { id: 'book3_catalog', name: '目录', category: '目录', level: 2, symbolSize: 45, collapsed: true, children: [] },
      { id: 'book3_images', name: '图片', category: '图片', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] },
      { id: 'book3_tables', name: '表格', category: '表格', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] },
      { id: 'book3_citations', name: '引文', category: '引文', level: 2, symbolSize: 45, collapsed: true, children: [] },
      { id: 'book3_articles', name: 'article', category: 'article', level: 2, symbolSize: 45, collapsed: true, loaded: false, children: [] }
    ]
  }
];

const totalNodes = computed(() => {
  let count = 0;
  const countNodes = (nodes: GraphNode[]) => {
    nodes.forEach(node => {
      count++;
      if (node.children) countNodes(node.children);
    });
  };
  countNodes(booksData);
  return count;
});

const totalLinks = computed(() => {
  let count = 0;
  const countLinks = (nodes: GraphNode[]) => {
    nodes.forEach(node => {
      if (node.children) {
        count += node.children.length;
        countLinks(node.children);
      }
    });
  };
  countLinks(booksData);
  return count;
});

// 扁平化所有节点供问答组件使用
const flattenedNodes = computed(() => {
  const nodes: GraphNode[] = [];
  const flatten = (nodeList: GraphNode[]) => {
    nodeList.forEach(node => {
      nodes.push({
        id: node.id,
        name: node.name,
        category: node.category,
        level: node.level,
        symbolSize: node.symbolSize
      });
      if (node.children) {
        flatten(node.children);
      }
    });
  };
  flatten(booksData);
  return nodes;
});

const initGraph = () => {
  if (!chartContainer.value) {
    console.error('图谱容器不存在');
    return;
  }
  
  console.log('开始初始化 ECharts');
  chart = echarts.init(chartContainer.value);
  console.log('ECharts 初始化完成，开始构建图谱');
  rebuildGraph();
  console.log('图谱构建完成');

  // 左键点击：展开/收起节点或预览
  chart.on('click', async (params: any) => {
    if (params.dataType === 'node' && !editMode.value) {
      const node = findNodeById(params.data.id);
      if (node) {
        // 如果是叶子节点（图片文件、表格文件、PDF、Markdown），则预览
        if (['图片文件', '表格文件', 'PDF', 'Markdown'].includes(node.category)) {
          previewFile(node);
          return;
        }
        
        // 如果是分类节点且未加载数据，则加载
        if (!node.loaded && node.level === 2) {
          if (node.category === '图片') {
            await loadImages(node);
          } else if (node.category === '表格') {
            await loadTables(node);
          } else if (node.category === 'article') {
            await loadArticles(node);
          }
        }
        
        // 展开/收起
        if (node.children) {
          node.collapsed = !node.collapsed;
          rebuildGraph();
        }
      }
    }
  });

  // 右键菜单：使用原生DOM事件
  const chartDom = chartContainer.value;
  chartDom.addEventListener('contextmenu', (e: MouseEvent) => {
    if (!editMode.value) return;
    e.preventDefault();
    
    // 获取点击位置
    const rect = chartDom.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 转换为图表坐标
    const pointInPixel = [x, y];
    if (!chart) return;
    
    // 获取当前图表配置
    const option = chart.getOption();
    const seriesData = option.series?.[0]?.data || [];
    
    // 查找点击的节点（通过距离判断）
    let clickedNode: any = null;
    let minDistance = Infinity;
    
    seriesData.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined) {
        const nodePixel = chart!.convertToPixel({ seriesIndex: 0 }, [node.x, node.y]);
        const distance = Math.sqrt(
          Math.pow(nodePixel[0] - x, 2) + 
          Math.pow(nodePixel[1] - y, 2)
        );
        
        if (distance < 40 && distance < minDistance) {
          minDistance = distance;
          clickedNode = node;
        }
      }
    });
    
    if (clickedNode) {
      const node = findNodeById(clickedNode.id);
      if (node) {
        contextMenu.value = {
          show: true,
          x: e.clientX,
          y: e.clientY,
          node
        };
      }
    }
  });
};

const findNodeById = (id: string): GraphNode | null => {
  const find = (nodes: GraphNode[]): GraphNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = find(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return find(booksData);
};

const rebuildGraph = () => {
  const nodes: any[] = [];
  const links: any[] = [];

  const traverse = (nodeList: GraphNode[], parentId?: string) => {
    nodeList.forEach(node => {
      const nodeData: any = {
        id: node.id,
        name: node.name,
        category: node.category,
        symbolSize: node.symbolSize,
        itemStyle: { color: nodeTypes.find(t => t.name === node.category)?.color }
      };
      
      // 如果是书籍节点且有封面，使用图片作为符号
      if (node.category === '书籍' && node.coverUrl) {
        nodeData.symbol = `image://${node.coverUrl}`;
        nodeData.symbolSize = [100, 140]; // [宽度, 高度] 书籍封面比例
      }
      
      nodes.push(nodeData);
      if (parentId) links.push({ source: parentId, target: node.id });
      if (!node.collapsed && node.children) traverse(node.children, node.id);
    });
  };

  traverse(booksData);
  console.log(`构建图谱数据: ${nodes.length} 个节点, ${links.length} 条连接`);
  
  if (nodes.length === 0) {
    console.error('没有节点数据！');
    return;
  }
  
  updateChart(nodes, links);
};

const updateChart = (nodes: any[], links: any[]) => {
  if (!chart) {
    console.error('图表对象不存在');
    return;
  }
  
  // 保存旧节点的位置（只在图表已有配置时）
  try {
    const oldOption = chart.getOption();
    if (oldOption && oldOption.series && oldOption.series[0]) {
      const oldNodes = oldOption.series[0].data || [];
      const positionMap = new Map();
      oldNodes.forEach((node: any) => {
        if (node.x !== undefined && node.y !== undefined) {
          positionMap.set(node.id, { x: node.x, y: node.y });
        }
      });
      
      // 恢复节点位置
      nodes.forEach(node => {
        const pos = positionMap.get(node.id);
        if (pos) {
          node.x = pos.x;
          node.y = pos.y;
        }
      });
    }
  } catch (error) {
    console.log('首次渲染，跳过位置恢复');
  }
  
  chart.setOption({
    backgroundColor: '#fafafa',
    tooltip: { 
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          let html = `<strong>${params.data.name}</strong><br/>类型: ${params.data.category}`;
          if (params.data.category === '书籍') {
            html += '<br/><span style="font-size:12px;color:#888;">点击展开查看子节点</span>';
          } else if (['图片', '表格', 'article'].includes(params.data.category)) {
            const node = findNodeById(params.data.id);
            if (node && !node.loaded) {
              html += '<br/><span style="font-size:12px;color:#48bb78;">💡 点击动态加载内容</span>';
            } else {
              html += '<br/><span style="font-size:12px;color:#888;">点击展开查看详情</span>';
            }
          } else if (['图片文件', '表格文件'].includes(params.data.category)) {
            html += '<br/><span style="font-size:12px;color:#667eea;">👁️ 点击预览</span>';
          } else if (['PDF', 'Markdown'].includes(params.data.category)) {
            html += '<br/><span style="font-size:12px;color:#667eea;">📖 点击阅读</span>';
          } else if (params.data.category === '目录' || params.data.category === '引文') {
            html += '<br/><span style="font-size:12px;color:#999;">暂未开放</span>';
          }
          return html;
        }
        return '';
      }
    },
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes.map(node => ({
        ...node,
        label: {
          show: true,
          position: node.category === '书籍' ? 'bottom' : 'bottom',
          distance: node.category === '书籍' ? 15 : 5,
          fontSize: node.category === '书籍' ? 13 : 11,
          fontWeight: node.category === '书籍' ? 600 : 500,
          color: '#2d3748',
          backgroundColor: node.category === '书籍' ? 'rgba(255,255,255,0.9)' : 'transparent',
          padding: node.category === '书籍' ? [4, 8] : 0,
          borderRadius: node.category === '书籍' ? 4 : 0
        }
      })),
      links: links,
      roam: true,
      draggable: true,
      force: { 
        repulsion: 350, 
        gravity: 0.05, 
        edgeLength: [150, 250],
        layoutAnimation: true
      },
      lineStyle: { 
        color: '#cbd5e0', 
        width: 2,
        curveness: 0.15
      },
      emphasis: { 
        focus: 'adjacency', 
        lineStyle: { 
          width: 3, 
          color: '#667eea' 
        },
        label: {
          fontSize: 14,
          fontWeight: 600
        }
      }
    }]
  }, true);
};

const goBack = () => {
  // 优先返回文件管理中心，如果没有历史记录则返回首页
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/file-list');
  }
};
const resetGraph = () => {
  booksData.forEach(b => {
    b.collapsed = true;
    b.children?.forEach(c => c.collapsed = true);
  });
  rebuildGraph();
};
const expandAll = () => {
  booksData.forEach(b => {
    b.collapsed = false;
    b.children?.forEach(c => c.collapsed = false);
  });
  rebuildGraph();
};
const collapseAll = () => resetGraph();
const saveGraph = () => {
  const blob = new Blob([JSON.stringify(booksData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '知识图谱.json';
  link.click();
  URL.revokeObjectURL(url);
};

const addChildNode = () => {
  editDialog.value = {
    show: true,
    mode: 'add',
    name: '',
    category: availableTypes.value[0],
    description: '',
    targetNode: contextMenu.value.node
  };
  contextMenu.value.show = false;
};

const editNode = () => {
  const node = contextMenu.value.node;
  if (!node) return;
  editDialog.value = {
    show: true,
    mode: 'edit',
    name: node.name,
    category: node.category,
    description: node.description || '',
    targetNode: node
  };
  contextMenu.value.show = false;
};

const deleteNode = () => {
  const node = contextMenu.value.node;
  if (!node || node.level === 1) return;
  
  const removeNode = (nodes: GraphNode[], id: string): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children && removeNode(nodes[i].children!, id)) {
        return true;
      }
    }
    return false;
  };
  
  removeNode(booksData, node.id);
  contextMenu.value.show = false;
  rebuildGraph();
};

const closeEditDialog = () => {
  editDialog.value.show = false;
};

const saveEditDialog = () => {
  if (!editDialog.value.name.trim()) return;
  
  if (editDialog.value.mode === 'add') {
    const parent = editDialog.value.targetNode;
    if (!parent) return;
    
    if (!parent.children) parent.children = [];
    
    const newNode: GraphNode = {
      id: `${parent.id}_new_${Date.now()}`,
      name: editDialog.value.name,
      category: editDialog.value.category,
      level: parent.level + 1,
      symbolSize: 28,
      description: editDialog.value.description,
      collapsed: true
    };
    
    parent.children.push(newNode);
  } else {
    const node = editDialog.value.targetNode;
    if (!node) return;
    
    node.name = editDialog.value.name;
    node.category = editDialog.value.category;
    node.description = editDialog.value.description;
  }
  
  closeEditDialog();
  rebuildGraph();
};

// 处理问答组件的节点跳转
const handleJumpToNode = (nodeId: string) => {
  console.log('跳转到节点:', nodeId);
  
  // 找到目标节点
  const targetNode = findNodeById(nodeId);
  if (!targetNode) {
    console.error('未找到节点:', nodeId);
    return;
  }
  
  // 展开到目标节点的路径
  const expandPathToNode = (nodes: GraphNode[], targetId: string, path: GraphNode[] = []): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        // 找到目标，展开路径上的所有节点
        path.forEach(n => n.collapsed = false);
        return true;
      }
      if (node.children) {
        if (expandPathToNode(node.children, targetId, [...path, node])) {
          return true;
        }
      }
    }
    return false;
  };
  
  expandPathToNode(booksData, nodeId);
  rebuildGraph();
  
  // 等待图表更新后高亮节点
  setTimeout(() => {
    if (chart) {
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: findNodeIndexInChart(nodeId)
      });
      
      // 3秒后取消高亮
      setTimeout(() => {
        chart?.dispatchAction({
          type: 'downplay',
          seriesIndex: 0,
          dataIndex: findNodeIndexInChart(nodeId)
        });
      }, 3000);
    }
  }, 500);
};

// 在图表数据中查找节点索引
const findNodeIndexInChart = (nodeId: string): number => {
  if (!chart) return -1;
  const option = chart.getOption();
  if (option && option.series && option.series[0]) {
    const data = (option.series[0] as any).data || [];
    return data.findIndex((node: any) => node.id === nodeId);
  }
  return -1;
};

onMounted(() => {
  // 延迟初始化，确保 DOM 已完全渲染
  setTimeout(() => {
    if (chartContainer.value) {
      console.log('初始化图谱，容器尺寸:', {
        width: chartContainer.value.offsetWidth,
        height: chartContainer.value.offsetHeight
      });
      initGraph();
    } else {
      console.error('图谱容器未找到');
    }
  }, 100);
  
  window.addEventListener('resize', () => {
    console.log('窗口大小改变，重新调整图表');
    chart?.resize();
  });
  document.addEventListener('click', () => contextMenu.value.show = false);
});

onUnmounted(() => {
  console.log('组件卸载，销毁图表');
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<style scoped>
.hierarchical-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.top-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 30px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.header-container {
  max-width: 1600px;
  margin: 0 auto;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-button {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.back-button:hover {
  background: rgba(255,255,255,0.3);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255,255,255,0.3);
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 500px;
}

.qa-section {
  padding: 20px 30px;
  background: #f7fafc;
}

.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e2e8f0;
  transition: width 0.3s;
  position: relative;
}

.sidebar.collapsed {
  width: 50px;
}

.toggle-btn {
  position: absolute;
  right: -12px;
  top: 20px;
  width: 24px;
  height: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 10;
}

.sidebar-content {
  padding: 24px;
}

.section {
  margin-bottom: 32px;
}

.section h3 {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
}

.section button {
  width: 100%;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  margin-bottom: 8px;
  transition: all 0.2s;
  text-align: left;
}

.section button:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat {
  background: #f7fafc;
  padding: 16px 12px;
  border-radius: 8px;
  text-align: center;
}

.stat span {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat label {
  font-size: 11px;
  color: #718096;
}

.legend div {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #4a5568;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.graph-container {
  flex: 1;
  position: relative;
  background: #fafafa;
}

.canvas {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.edit-hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #667eea;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(102,126,234,0.3);
}

.loading-hint {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: #48bb78;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(72,187,120,0.3);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 6px;
  z-index: 1000;
  min-width: 160px;
}

.context-menu div {
  padding: 10px 14px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  transition: background 0.2s;
}

.context-menu div:hover {
  background: #f7fafc;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.dialog h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
}

.dialog input,
.dialog select,
.dialog textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  font-family: inherit;
}

.dialog textarea {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.actions button {
  padding: 10px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.actions button.primary {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.actions button:hover {
  opacity: 0.8;
}

/* 预览模态框 */
.preview-modal .preview-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f7fafc;
}

.preview-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #718096;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #2d3748;
}

.preview-content {
  padding: 24px;
  overflow: auto;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7fafc;
}

.preview-content img {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 8px;
}
</style>
