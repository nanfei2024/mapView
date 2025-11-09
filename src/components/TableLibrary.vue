<template>
  <div class="table-library-component">
    <div class="content-wrapper">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="action-btn btn-import" @click="handleImport">
            <span class="btn-icon">📥</span>
            <span>导入表格</span>
          </button>
          <button class="action-btn btn-create" @click="handleCreate">
            <span class="btn-icon">➕</span>
            <span>新建表格</span>
          </button>
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchKeyword" 
              type="text" 
              class="search-input" 
              placeholder="搜索表格名称..."
              @input="handleSearch"
            />
          </div>
          <select v-model="categoryFilter" class="filter-select" @change="handleFilter">
            <option value="">全部分类</option>
            <option value="地质数据">地质数据</option>
            <option value="矿物成分">矿物成分</option>
            <option value="地貌特征">地貌特征</option>
            <option value="板块运动">板块运动</option>
            <option value="其他">其他</option>
          </select>
          <select v-model="typeFilter" class="filter-select" @change="handleFilter">
            <option value="">表格类型</option>
            <option value="Excel">Excel (xlsx)</option>
            <option value="CSV">CSV</option>
            <option value="JSON">JSON</option>
          </select>
        </div>
        <div class="toolbar-right">
          <button 
            class="delete-btn"
            :disabled="selectedTables.length === 0"
            @click="batchDelete"
          >
            <span>🗑️</span>
            <span>批量删除 {{ selectedTables.length > 0 ? `(${selectedTables.length})` : '' }}</span>
          </button>
        </div>
      </div>

      <!-- 表格卡片列表 -->
      <div class="table-grid">
        <div v-if="filteredTables.length === 0" class="empty-state">
          <span class="empty-icon">📊</span>
          <p>暂无表格</p>
          <button class="empty-action-btn" @click="handleImport">
            <span>📥</span>
            <span>导入第一个表格</span>
          </button>
        </div>
        <div 
          v-for="table in filteredTables" 
          :key="table.id"
          class="table-card"
          :class="{ selected: isSelected(table.id) }"
        >
          <div class="card-header">
            <div class="card-checkbox">
              <input 
                type="checkbox" 
                :checked="isSelected(table.id)"
                @change="toggleSelect(table.id)"
              />
            </div>
            <div class="card-icon" :class="'icon-' + table.type">
              {{ getTableIcon(table.type) }}
            </div>
            <div class="card-actions">
              <button class="card-action-btn" @click="viewTable(table)" title="查看">
                👁️
              </button>
              <button class="card-action-btn" @click="downloadTable(table)" title="下载">
                ⬇️
              </button>
            </div>
          </div>
          <div class="card-body">
            <h4 class="table-name" :title="table.name">{{ table.name }}</h4>
            <p class="table-description">{{ table.description }}</p>
            <div class="table-stats">
              <div class="stat-item">
                <span class="stat-icon">📝</span>
                <span class="stat-text">{{ table.rows }} 行</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">📋</span>
                <span class="stat-text">{{ table.columns }} 列</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">💾</span>
                <span class="stat-text">{{ formatSize(table.size) }}</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <div class="footer-left">
              <span class="type-badge" :class="'type-' + table.type">
                {{ table.type }}
              </span>
              <span class="category-badge">
                {{ table.category }}
              </span>
            </div>
            <div class="footer-right">
              <button class="footer-btn" @click="editTable(table)" title="编辑">
                ✏️
              </button>
              <button class="footer-btn" @click="deleteTable(table.id)" title="删除">
                🗑️
              </button>
            </div>
          </div>
          <div class="card-date">
            更新于 {{ formatDate(table.updateTime) }}
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <div class="pagination-info">
          <span>共 {{ totalTables }} 个表格</span>
          <select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
            <option :value="9">9/page</option>
            <option :value="18">18/page</option>
            <option :value="36">36/page</option>
            <option :value="72">72/page</option>
          </select>
        </div>
        <div class="pagination-controls">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            ‹
          </button>
          <button 
            v-for="page in visiblePages" 
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
            ›
          </button>
          <div class="page-jump">
            <span>Go to</span>
            <input 
              type="number" 
              class="page-input"
              v-model.number="jumpPage"
              @keyup.enter="jumpToPage"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 表格预览模态框 -->
    <div v-if="showPreview" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <div class="preview-header">
          <h3>{{ previewTableData?.name }}</h3>
          <button class="preview-close" @click="closePreview">✕</button>
        </div>
        <div class="preview-body">
          <div class="preview-info-section">
            <div class="info-item">
              <span class="info-label">分类：</span>
              <span class="info-value">{{ previewTableData?.category }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">类型：</span>
              <span class="info-value">{{ previewTableData?.type }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">行数：</span>
              <span class="info-value">{{ previewTableData?.rows }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">列数：</span>
              <span class="info-value">{{ previewTableData?.columns }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">大小：</span>
              <span class="info-value">{{ formatSize(previewTableData?.size) }}</span>
            </div>
          </div>
          <div class="preview-description">
            <h4>描述</h4>
            <p>{{ previewTableData?.description }}</p>
          </div>
          <div class="preview-actions">
            <button class="preview-action-btn btn-download" @click="downloadTable(previewTableData)">
              <span>⬇️</span>
              <span>下载</span>
            </button>
            <button class="preview-action-btn btn-edit" @click="editTable(previewTableData)">
              <span>✏️</span>
              <span>编辑</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 表格数据接口
interface TableData {
  id: number;
  name: string;
  description: string;
  category: string;
  type: string;
  rows: number;
  columns: number;
  size: number;
  updateTime: string;
}

// 状态管理
const searchKeyword = ref('');
const categoryFilter = ref('');
const typeFilter = ref('');
const selectedTables = ref<number[]>([]);
const currentPage = ref(1);
const pageSize = ref(9);
const jumpPage = ref(1);
const showPreview = ref(false);
const previewTableData = ref<TableData | null>(null);

// 模拟表格数据
const tables = ref<TableData[]>([
  {
    id: 1,
    name: '亚洲地质板块数据统计表',
    description: '包含亚洲主要地质板块的分布、面积、运动速度等详细数据',
    category: '地质数据',
    type: 'Excel',
    rows: 156,
    columns: 12,
    size: 458000,
    updateTime: '2025-11-09 10:30:00'
  },
  {
    id: 2,
    name: '中国主要矿物成分分析',
    description: '中国境内主要矿物的化学成分、物理性质、分布区域统计',
    category: '矿物成分',
    type: 'CSV',
    rows: 342,
    columns: 8,
    size: 125000,
    updateTime: '2025-11-08 14:20:00'
  },
  {
    id: 3,
    name: '板块运动监测数据',
    description: '2020-2025年全球主要板块运动监测数据，包括位移、速度、方向',
    category: '板块运动',
    type: 'JSON',
    rows: 2580,
    columns: 15,
    size: 1850000,
    updateTime: '2025-11-07 09:15:00'
  },
  {
    id: 4,
    name: '地貌特征分类表',
    description: '按照地貌形态、成因、分布等特征进行的详细分类统计',
    category: '地貌特征',
    type: 'Excel',
    rows: 89,
    columns: 10,
    size: 325000,
    updateTime: '2025-11-06 16:45:00'
  },
  {
    id: 5,
    name: '地震历史记录数据库',
    description: '近100年来全球重大地震事件记录，包括震级、深度、伤亡等信息',
    category: '地质数据',
    type: 'CSV',
    rows: 1256,
    columns: 18,
    size: 985000,
    updateTime: '2025-11-05 11:20:00'
  },
]);

// 过滤表格
const filteredTables = computed(() => {
  let result = tables.value;
  
  if (searchKeyword.value) {
    result = result.filter(table => 
      table.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      table.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  
  if (categoryFilter.value) {
    result = result.filter(table => table.category === categoryFilter.value);
  }
  
  if (typeFilter.value) {
    result = result.filter(table => table.type === typeFilter.value);
  }
  
  return result;
});

// 分页计算
const totalTables = computed(() => filteredTables.value.length);
const totalPages = computed(() => Math.ceil(totalTables.value / pageSize.value));
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

// 选择相关
const isSelected = (id: number) => selectedTables.value.includes(id);

const toggleSelect = (id: number) => {
  const index = selectedTables.value.indexOf(id);
  if (index > -1) {
    selectedTables.value.splice(index, 1);
  } else {
    selectedTables.value.push(id);
  }
};

// 搜索和筛选
const handleSearch = () => {
  currentPage.value = 1;
};

const handleFilter = () => {
  currentPage.value = 1;
};

// 分页
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const jumpToPage = () => {
  if (jumpPage.value >= 1 && jumpPage.value <= totalPages.value) {
    currentPage.value = jumpPage.value;
  }
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
};

// 表格操作
const handleImport = () => {
  ElMessage.info('导入功能开发中...');
};

const handleCreate = () => {
  ElMessage.info('新建功能开发中...');
};

const viewTable = (table: TableData) => {
  previewTableData.value = table;
  showPreview.value = true;
};

const closePreview = () => {
  showPreview.value = false;
  previewTableData.value = null;
};

const downloadTable = (table: TableData | null) => {
  if (table) {
    ElMessage.success(`下载 ${table.name}`);
  }
};

const editTable = (table: TableData | null) => {
  if (table) {
    ElMessage.info(`编辑 ${table.name}`);
  }
};

const deleteTable = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个表格吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    ElMessage.success('删除成功');
    tables.value = tables.value.filter(table => table.id !== id);
  } catch {
    // 用户取消
  }
};

const batchDelete = async () => {
  if (selectedTables.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTables.value.length} 个表格吗？`, 
      '批量删除', 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    ElMessage.success(`成功删除 ${selectedTables.value.length} 个表格`);
    tables.value = tables.value.filter(table => !selectedTables.value.includes(table.id));
    selectedTables.value = [];
  } catch {
    // 用户取消
  }
};

// 工具函数
const getTableIcon = (type: string) => {
  const icons: Record<string, string> = {
    'Excel': '📊',
    'CSV': '📋',
    'JSON': '📄'
  };
  return icons[type] || '📝';
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
/* 组件容器 */
.table-library-component {
  width: 100%;
  padding-top: 24px;
}

.content-wrapper {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.btn-import {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.btn-import:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-create {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 300px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.delete-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #fecaca;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover:not(:disabled) {
  background: #fef2f2;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 表格网格 */
.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  min-height: 400px;
}

.table-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
}

.table-card.selected {
  border-color: #667eea;
  background: #eff6ff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.card-icon.icon-Excel {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-icon.icon-CSV {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.card-icon.icon-JSON {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.card-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.card-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-action-btn:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.card-body {
  flex: 1;
}

.table-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.table-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.table-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
}

.stat-icon {
  font-size: 14px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.footer-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-badge, .category-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.type-badge.type-Excel {
  background: #dcfce7;
  color: #15803d;
}

.type-badge.type-CSV {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.type-JSON {
  background: #fef3c7;
  color: #b45309;
}

.category-badge {
  background: #f3f4f6;
  color: #6b7280;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.footer-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-btn:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.card-date {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  opacity: 0.3;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 18px;
  color: #9ca3af;
  margin-bottom: 24px;
}

.empty-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
}

.page-size-select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.page-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
}

.page-input {
  width: 60px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

/* 预览模态框 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.preview-content {
  width: 90%;
  max-width: 600px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.preview-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
  flex: 1;
  padding-right: 20px;
}

.preview-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.preview-close:hover {
  background: #e5e7eb;
  transform: rotate(90deg);
}

.preview-body {
  padding: 24px;
}

.preview-info-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #1f2937;
}

.preview-description {
  margin-bottom: 24px;
}

.preview-description h4 {
  font-size: 15px;
  color: #374151;
  margin: 0 0 12px 0;
}

.preview-description p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.preview-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.btn-download {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.btn-download:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-edit {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* 响应式 */
@media (max-width: 1024px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left {
    flex-direction: column;
  }
  
  .search-wrapper {
    max-width: none;
  }
  
  .table-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }
  
  .table-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 16px;
  }
  
  .preview-info-section {
    grid-template-columns: 1fr;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>

