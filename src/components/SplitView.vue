<template>
  <div class="split-container" :class="{ 'is-split': isVisible }">
    <!-- 左侧地图区域 -->
    <div class="map-area" :style="mapStyle">
      <slot name="map"></slot>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-area" v-show="isVisible">
      <div class="content-header">
        <h3>{{ selectedLayer?.name }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="content-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="content-body">
        <div v-show="currentTab === 'bookInfo'" class="tab-panel">
          <!-- 书籍信息面板内容 -->
        </div>
        <div v-show="currentTab === 'textContent'" class="tab-panel">
          <!-- 文字内容面板内容 -->
        </div>
        <div v-show="currentTab === 'imageDisplay'" class="tab-panel">
          <!-- 图片展示面板内容 -->
        </div>
        <div v-show="currentTab === 'tableDisplay'" class="tab-panel">
          <!-- 表格展示面板内容 -->
          <div class="table-view">
            <h4>数据表格展示</h4>
            <el-table :data="tableData" border style="width: 100%">
              <el-table-column v-for="column in tableColumns" :key="column.prop" :prop="column.prop" :label="column.label" :width="column.width"></el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isVisible: Boolean,
  selectedLayer: Object
});

const emit = defineEmits(['close']);

const currentTab = ref('bookInfo');

// 表格数据
const tableData = ref([]);
const tableColumns = ref([
  { prop: 'name', label: '名称', width: '120' },
  { prop: 'type', label: '类型', width: '100' },
  { prop: 'value', label: '数值', width: '120' },
  { prop: 'description', label: '描述' }
]);

// 监听选中图层变化，更新表格数据
watch(() => props.selectedLayer, (newLayer) => {
  if (newLayer && newLayer.data) {
    // 这里根据实际数据结构处理表格数据
    tableData.value = Array.isArray(newLayer.data) ? newLayer.data : [];
  } else {
    tableData.value = [];
  }
}, { immediate: true });

const tabs = [
  { id: 'bookInfo', label: '书籍信息' },
  { id: 'textContent', label: '文字内容' },
  { id: 'imageDisplay', label: '图片展示' },
  { id: 'tableDisplay', label: '表格展示' }
];

const mapStyle = computed(() => ({
  width: props.isVisible ? '40%' : '100%'
}));

const close = () => {
  emit('close');
};
</script>

<style scoped>
.split-container {
  width: 100%;
  height: 100vh;
  display: flex;
  position: relative;
}

.map-area {
  height: 100%;
  transition: width 0.3s ease;
}

.content-area {
  width: 60%;
  height: 100%;
  background: white;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.content-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.content-tabs {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.content-tabs button {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.content-tabs button.active {
  background: #ede9fe;
  color: #4f46e5;
}

.content-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
}

.table-view {
  width: 100%;
}

.table-view h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #333;
}
</style> 