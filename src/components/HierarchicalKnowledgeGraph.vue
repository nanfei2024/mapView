<template>
  <div class="hierarchical-graph-container">
    <div class="graph-header">
      <h2>书籍知识图谱</h2>
      <div class="graph-controls">
        <button @click="resetGraph" class="control-btn">
          <span>🔄</span>
          <span>重置</span>
        </button>
        <button @click="expandAll" class="control-btn">
          <span>📖</span>
          <span>全部展开</span>
        </button>
        <button @click="collapseAll" class="control-btn">
          <span>📕</span>
          <span>全部收起</span>
        </button>
        <button class="control-btn" @click="openFullPage" title="打开完整页面">
          <span>🔗</span>
          <span>完整页面</span>
        </button>
      </div>
    </div>

    <div class="graph-canvas" ref="graphContainer"></div>

    <!-- 节点详情面板 -->
    <div class="detail-panel" v-if="selectedNode" :class="{ show: selectedNode }">
      <div class="panel-header">
        <h3>{{ selectedNode.name }}</h3>
        <button @click="selectedNode = null" class="close-btn">×</button>
      </div>
      <div class="panel-content">
        <div class="info-item">
          <span class="label">类型:</span>
          <span class="value">{{ selectedNode.category }}</span>
        </div>
        <div class="info-item" v-if="selectedNode.author">
          <span class="label">作者:</span>
          <span class="value">{{ selectedNode.author }}</span>
        </div>
        <div class="info-item" v-if="selectedNode.description">
          <span class="label">描述:</span>
          <span class="value">{{ selectedNode.description }}</span>
        </div>
        <div class="info-item" v-if="selectedNode.children && selectedNode.children.length > 0">
          <span class="label">子节点:</span>
          <span class="value">{{ selectedNode.children.length }} 个</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';

const router = useRouter();

interface GraphNode {
  id: string;
  name: string;
  category: string;
  level: number;
  symbolSize: number;
  x?: number;
  y?: number;
  author?: string;
  description?: string;
  children?: GraphNode[];
  collapsed?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
}

const graphContainer = ref<HTMLElement | null>(null);
const selectedNode = ref<GraphNode | null>(null);
let chart: echarts.ECharts | null = null;

// 三本书籍的数据结构
const booksData: GraphNode[] = [
  {
    id: 'book1',
    name: '板块构造与地貌形迹',
    category: '书籍',
    level: 1,
    symbolSize: 80,
    author: '陈志明',
    description: '详细阐述板块构造理论与地貌形成的关系',
    collapsed: true,
    children: [
      {
        id: 'book1_catalog',
        name: '目录',
        category: '目录',
        level: 2,
        symbolSize: 50,
        description: '本书完整目录结构',
        collapsed: true,
        children: [
          { id: 'book1_catalog_1', name: '第一章：劳亚区系', category: '章节', level: 3, symbolSize: 30, description: '劳亚区系的地质特征与演化' },
          { id: 'book1_catalog_2', name: '第二章：冈瓦纳区系', category: '章节', level: 3, symbolSize: 30, description: '冈瓦纳区系的形成与发展' },
          { id: 'book1_catalog_3', name: '第三章：特提斯陆间带', category: '章节', level: 3, symbolSize: 30, description: '特提斯陆间带的演化历史' },
        ]
      },
      {
        id: 'book1_figures',
        name: '图表',
        category: '图表',
        level: 2,
        symbolSize: 50,
        description: '书中所有图表资源',
        collapsed: true,
        children: [
          { id: 'book1_fig_1', name: '图1-1：板块分布图', category: '图片', level: 3, symbolSize: 30, description: '全球板块分布示意图' },
          { id: 'book1_fig_2', name: '图2-1：地貌演化图', category: '图片', level: 3, symbolSize: 30, description: '地貌形成演化过程' },
          { id: 'book1_fig_3', name: '表1-1：地质年代表', category: '表格', level: 3, symbolSize: 30, description: '地质年代划分表' },
        ]
      },
      {
        id: 'book1_citations',
        name: '引文',
        category: '引文',
        level: 2,
        symbolSize: 50,
        description: '参考文献与引用',
        collapsed: true,
        children: [
          { id: 'book1_cite_1', name: '威尔逊旋回理论', category: '引用', level: 3, symbolSize: 30, description: 'Wilson, J.T. (1966)' },
          { id: 'book1_cite_2', name: '板块构造学说', category: '引用', level: 3, symbolSize: 30, description: 'Plate Tectonics Theory' },
          { id: 'book1_cite_3', name: '大陆漂移假说', category: '引用', level: 3, symbolSize: 30, description: 'Wegener, A. (1915)' },
        ]
      }
    ]
  },
  {
    id: 'book2',
    name: '亚洲地貌圈及其板块造貌构造纲要',
    category: '书籍',
    level: 1,
    symbolSize: 80,
    author: '陈志明',
    description: '研究亚洲地貌圈的板块构造特征',
    collapsed: true,
    children: [
      {
        id: 'book2_catalog',
        name: '目录',
        category: '目录',
        level: 2,
        symbolSize: 50,
        description: '本书完整目录结构',
        collapsed: true,
        children: [
          { id: 'book2_catalog_1', name: '第一章：亚洲地貌概述', category: '章节', level: 3, symbolSize: 30, description: '亚洲地貌的基本特征' },
          { id: 'book2_catalog_2', name: '第二章：喜马拉雅造山带', category: '章节', level: 3, symbolSize: 30, description: '喜马拉雅山脉的形成' },
          { id: 'book2_catalog_3', name: '第三章：青藏高原隆升', category: '章节', level: 3, symbolSize: 30, description: '青藏高原的演化过程' },
        ]
      },
      {
        id: 'book2_figures',
        name: '图表',
        category: '图表',
        level: 2,
        symbolSize: 50,
        description: '书中所有图表资源',
        collapsed: true,
        children: [
          { id: 'book2_fig_1', name: '图1-1：亚洲地形图', category: '图片', level: 3, symbolSize: 30, description: '亚洲主要地形分布' },
          { id: 'book2_fig_2', name: '图2-1：板块碰撞图', category: '图片', level: 3, symbolSize: 30, description: '印度板块与欧亚板块碰撞' },
          { id: 'book2_fig_3', name: '表1-1：高原隆升数据', category: '表格', level: 3, symbolSize: 30, description: '青藏高原隆升速率数据' },
        ]
      },
      {
        id: 'book2_citations',
        name: '引文',
        category: '引文',
        level: 2,
        symbolSize: 50,
        description: '参考文献与引用',
        collapsed: true,
        children: [
          { id: 'book2_cite_1', name: '印度-亚洲碰撞', category: '引用', level: 3, symbolSize: 30, description: 'Molnar & Tapponnier (1975)' },
          { id: 'book2_cite_2', name: '高原隆升机制', category: '引用', level: 3, symbolSize: 30, description: 'Royden et al. (2008)' },
          { id: 'book2_cite_3', name: '构造地貌学', category: '引用', level: 3, symbolSize: 30, description: 'Burbank & Anderson (2011)' },
        ]
      }
    ]
  },
  {
    id: 'book3',
    name: '地学新两论',
    category: '书籍',
    level: 1,
    symbolSize: 80,
    author: '陈志明',
    description: '板块造貌构造学的新发展',
    collapsed: true,
    children: [
      {
        id: 'book3_catalog',
        name: '目录',
        category: '目录',
        level: 2,
        symbolSize: 50,
        description: '本书完整目录结构',
        collapsed: true,
        children: [
          { id: 'book3_catalog_1', name: '第一章：板块学说新发展', category: '章节', level: 3, symbolSize: 30, description: '现代板块构造理论' },
          { id: 'book3_catalog_2', name: '第二章：造貌构造学', category: '章节', level: 3, symbolSize: 30, description: '地貌与构造的关系' },
          { id: 'book3_catalog_3', name: '第三章：地学研究方法', category: '章节', level: 3, symbolSize: 30, description: '现代地学研究技术' },
        ]
      },
      {
        id: 'book3_figures',
        name: '图表',
        category: '图表',
        level: 2,
        symbolSize: 50,
        description: '书中所有图表资源',
        collapsed: true,
        children: [
          { id: 'book3_fig_1', name: '图1-1：板块运动模式', category: '图片', level: 3, symbolSize: 30, description: '全球板块运动示意' },
          { id: 'book3_fig_2', name: '图2-1：构造类型图', category: '图片', level: 3, symbolSize: 30, description: '主要构造类型分类' },
          { id: 'book3_fig_3', name: '表1-1：研究方法对比', category: '表格', level: 3, symbolSize: 30, description: '传统与现代方法对比' },
        ]
      },
      {
        id: 'book3_citations',
        name: '引文',
        category: '引文',
        level: 2,
        symbolSize: 50,
        description: '参考文献与引用',
        collapsed: true,
        children: [
          { id: 'book3_cite_1', name: '地球动力学', category: '引用', level: 3, symbolSize: 30, description: 'Turcotte & Schubert (2014)' },
          { id: 'book3_cite_2', name: 'GPS测量技术', category: '引用', level: 3, symbolSize: 30, description: 'Blewitt et al. (2018)' },
          { id: 'book3_cite_3', name: '数值模拟方法', category: '引用', level: 3, symbolSize: 30, description: 'Gerya (2019)' },
        ]
      }
    ]
  }
];

// 当前显示的节点和连接
const currentNodes = ref<GraphNode[]>([]);
const currentLinks = ref<GraphLink[]>([]);

// 初始化图谱
const initGraph = () => {
  if (!graphContainer.value) return;

  chart = echarts.init(graphContainer.value);
  
  // 初始只显示三本书
  currentNodes.value = booksData.map(book => ({
    ...book,
    children: undefined // 不在图谱数据中包含children
  }));
  currentLinks.value = [];

  updateChart();

  // 监听点击事件
  chart.on('click', (params: any) => {
    if (params.dataType === 'node') {
      handleNodeClick(params.data.id);
    }
  });
};

// 处理节点点击
const handleNodeClick = (nodeId: string) => {
  const findNode = (nodes: GraphNode[], id: string): GraphNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const clickedNode = findNode(booksData, nodeId);
  if (!clickedNode) return;

  // 显示详情面板
  selectedNode.value = clickedNode;

  // 如果节点有子节点，展开/收起
  if (clickedNode.children && clickedNode.children.length > 0) {
    clickedNode.collapsed = !clickedNode.collapsed;
    rebuildGraph();
  }
};

// 重建图谱（根据展开状态）
const rebuildGraph = () => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const traverse = (nodeList: GraphNode[], parentId?: string) => {
    nodeList.forEach(node => {
      // 添加节点（不包含children属性）
      nodes.push({
        id: node.id,
        name: node.name,
        category: node.category,
        level: node.level,
        symbolSize: node.symbolSize,
        author: node.author,
        description: node.description,
        collapsed: node.collapsed
      });

      // 如果有父节点，添加连接
      if (parentId) {
        links.push({ source: parentId, target: node.id });
      }

      // 如果节点未收起且有子节点，递归处理
      if (!node.collapsed && node.children) {
        traverse(node.children, node.id);
      }
    });
  };

  traverse(booksData);

  currentNodes.value = nodes;
  currentLinks.value = links;
  updateChart();
};

// 更新图表
const updateChart = () => {
  if (!chart) return;

  const categories = [
    { name: '书籍' },
    { name: '目录' },
    { name: '图表' },
    { name: '引文' },
    { name: '章节' },
    { name: '图片' },
    { name: '表格' },
    { name: '引用' }
  ];

  const categoryColors: Record<string, string> = {
    '书籍': '#5470c6',
    '目录': '#91cc75',
    '图表': '#fac858',
    '引文': '#ee6666',
    '章节': '#73c0de',
    '图片': '#3ba272',
    '表格': '#fc8452',
    '引用': '#9a60b4'
  };

  const option: echarts.EChartsOption = {
    title: {
      text: '三层级知识图谱',
      left: 'center',
      top: 10,
      textStyle: {
        color: '#333',
        fontSize: 20,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          let html = `<strong>${params.data.name}</strong><br/>`;
          html += `类型: ${params.data.category}<br/>`;
          if (params.data.author) html += `作者: ${params.data.author}<br/>`;
          if (params.data.description) html += `描述: ${params.data.description}`;
          return html;
        }
        return '';
      }
    },
    legend: [{
      data: categories.map(c => c.name),
      orient: 'vertical',
      right: 20,
      top: 60,
      itemGap: 12,
      textStyle: {
        fontSize: 12
      }
    }],
    series: [{
      type: 'graph',
      layout: 'force',
      data: currentNodes.value.map(node => ({
        ...node,
        itemStyle: {
          color: categoryColors[node.category] || '#5470c6'
        },
        label: {
          show: true,
          position: 'bottom',
          fontSize: node.level === 1 ? 14 : node.level === 2 ? 12 : 10,
          fontWeight: node.level === 1 ? 'bold' : 'normal'
        }
      })),
      links: currentLinks.value,
      categories: categories,
      roam: true,
      draggable: true,
      force: {
        repulsion: currentNodes.value.length > 10 ? 150 : 300,
        gravity: 0.1,
        edgeLength: [80, 150],
        layoutAnimation: true
      },
      lineStyle: {
        color: '#999',
        width: 2,
        curveness: 0.2
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 4
        }
      }
    }]
  };

  chart.setOption(option, true);
};

// 重置图谱
const resetGraph = () => {
  booksData.forEach(book => {
    book.collapsed = true;
    if (book.children) {
      book.children.forEach(child => {
        child.collapsed = true;
      });
    }
  });
  rebuildGraph();
  selectedNode.value = null;
};

// 全部展开
const expandAll = () => {
  booksData.forEach(book => {
    book.collapsed = false;
    if (book.children) {
      book.children.forEach(child => {
        child.collapsed = false;
      });
    }
  });
  rebuildGraph();
};

// 全部收起
const collapseAll = () => {
  resetGraph();
};

// 打开完整页面
const openFullPage = () => {
  router.push('/hierarchical-graph');
};

// 重置视图
const resetView = () => {
  chart?.resize();
};

// 导出图谱
const exportGraph = () => {
  const dataStr = JSON.stringify(booksData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '知识图谱数据.json';
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  initGraph();
  window.addEventListener('resize', () => {
    chart?.resize();
  });
});

onUnmounted(() => {
  chart?.dispose();
});
</script>

<style scoped>
.hierarchical-graph-container {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.graph-header {
  padding: 20px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.graph-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.graph-controls {
  display: flex;
  gap: 10px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.graph-canvas {
  flex: 1;
  width: 100%;
  min-height: 500px;
}

.detail-panel {
  position: absolute;
  right: -350px;
  top: 80px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;
  z-index: 10;
}

.detail-panel.show {
  right: 20px;
}

.panel-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 28px;
  height: 28px;
}

.close-btn:hover {
  opacity: 0.8;
}

.panel-content {
  padding: 20px;
}

.info-item {
  margin-bottom: 15px;
}

.info-item .label {
  display: block;
  font-size: 12px;
  color: #667eea;
  margin-bottom: 5px;
  font-weight: 600;
  text-transform: uppercase;
}

.info-item .value {
  display: block;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}
</style>
