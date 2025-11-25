<template>
  <div ref="chartContainer" class="graph-visualization"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import type { GraphData } from '../utils/knowledgeExtractor';

const props = defineProps<{
  graphData: GraphData | null;
  layout: string;
}>();

const emit = defineEmits<{
  (e: 'nodeClick', nodeData: any): void;
}>();

const chartContainer = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartContainer.value) return;
  
  chart = echarts.init(chartContainer.value);
  
  chart.on('click', (params: any) => {
    if (params.dataType === 'node') {
      emit('nodeClick', params.data);
    }
  });
  
  updateChart();
};

const updateChart = () => {
  if (!chart || !props.graphData) return;

  const option: echarts.EChartsOption = {
    title: {
      text: '知识图谱',
      left: 'center',
      top: 20,
      textStyle: {
        color: '#3498db',
        fontSize: 24,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `<strong>${params.data.name}</strong><br/>类型: ${params.data.type}<br/>连接数: ${params.data.value}`;
        } else if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}`;
        }
        return '';
      },
    },
    legend: [{
      data: props.graphData.categories.map(c => c.name),
      orient: 'vertical',
      left: 10,
      top: 80,
      textStyle: {
        color: '#ecf0f1',
      },
    }],
    series: [{
      type: 'graph',
      layout: props.layout === 'force' ? 'force' : props.layout,
      data: props.graphData.nodes,
      links: props.graphData.edges,
      categories: props.graphData.categories,
      roam: true,
      label: {
        show: true,
        position: 'right',
        formatter: '{b}',
        fontSize: 12,
        color: '#ecf0f1',
      },
      labelLayout: {
        hideOverlap: true,
      },
      lineStyle: {
        color: 'source',
        curveness: 0.3,
        opacity: 0.6,
      },
      emphasis: {
        focus: 'adjacency',
        label: {
          fontSize: 14,
          fontWeight: 'bold',
        },
        lineStyle: {
          width: 3,
        },
      },
      force: props.layout === 'force' ? {
        repulsion: 200,
        gravity: 0.1,
        edgeLength: [50, 150],
        layoutAnimation: true,
      } : undefined,
      circular: props.layout === 'circular' ? {
        rotateLabel: true,
      } : undefined,
    }],
  };

  chart.setOption(option);
};

watch(() => props.graphData, () => {
  updateChart();
}, { deep: true });

watch(() => props.layout, () => {
  updateChart();
});

onMounted(() => {
  initChart();
  window.addEventListener('resize', () => {
    chart?.resize();
  });
});

onUnmounted(() => {
  chart?.dispose();
});

defineExpose({
  resize: () => chart?.resize(),
});
</script>

<style scoped>
.graph-visualization {
  width: 100%;
  height: 100%;
  min-height: 500px;
}
</style>
