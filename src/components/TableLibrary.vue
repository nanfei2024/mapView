<template>
  <div class="table-library-component">
    <div class="content-wrapper">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <select v-model="selectedBookId" class="book-select" @change="handleBookChange">
            <option :value="undefined">所有书籍</option>
            <option v-for="book in books" :key="book.id" :value="book.id">
              {{ book.title || book.name }}
            </option>
          </select>
          <button class="action-btn btn-import" @click="handleImport">
            <span class="btn-icon">📥</span>
            <span>导入表格</span>
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

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 表格卡片列表 -->
      <div v-else class="table-grid">
        <div v-if="allTables.length === 0" class="empty-state">
          <span class="empty-icon">📊</span>
          <p>暂无表格</p>
          <button class="empty-action-btn" @click="handleImport">
            <span>📥</span>
            <span>导入第一个表格</span>
          </button>
        </div>
        <div 
          v-for="table in paginatedTables" 
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
            <p class="table-description">{{ table.folderName || '未知文件夹' }}</p>
            <div class="table-stats">
              <div class="stat-item">
                <span class="stat-icon">📁</span>
                <span class="stat-text">{{ table.folderName }}</span>
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
            </div>
            <div class="footer-right">
              <button class="footer-btn" @click="viewTable(table)" title="查看">👁️</button>
              <button class="footer-btn" @click="downloadTable(table)" title="下载">⬇️</button>
              <button class="footer-btn" @click="deleteTable(table)" title="删除">🗑️</button>
            </div>
          </div>
          <div class="card-date">
            更新于 {{ formatDate(table.lastModified) }}
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <div class="pagination-info">
          <span>共 {{ allTables.length }} 个表格</span>
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
          <div v-if="previewLoading" class="preview-loading">
            <div class="spinner-small"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="previewError" class="preview-error">
            <p>{{ previewError }}</p>
            <button v-if="previewTableData" class="preview-action-btn btn-download" @click="downloadTable(previewTableData)">
              <span>⬇️</span>
              <span>下载文件</span>
            </button>
          </div>
          <div v-else-if="previewTableData" class="preview-image-container">
            <img 
              :src="getImageUrl(previewTableData.url)" 
              :alt="previewTableData.name" 
              @error="handleImageError"
              class="preview-image"
            />
            <div class="preview-info-section">
              <div class="info-item">
                <span class="info-label">文件名：</span>
                <span class="info-value">{{ previewTableData.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">文件夹：</span>
                <span class="info-value">{{ previewTableData.folderName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">大小：</span>
                <span class="info-value">{{ formatSize(previewTableData.size) }}</span>
              </div>
            </div>
            <div class="preview-actions">
              <button class="preview-action-btn btn-download" @click="downloadTable(previewTableData)">
                <span>⬇️</span>
                <span>下载</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fileApi, type FileItem } from '../api/fileApi';
import { bookApi, type Book } from '../api/bookApi';

// 表格数据接口
interface TableData {
  id: string;  // 使用 property_name 作为唯一ID
  name: string;
  folderName: string;  // 章节属性（如 "1.1"）
  property: string;
  type: string;  // Excel, CSV, JSON
  size: number;
  lastModified: number;
  url: string;
  bookId?: number;
}

// 状态管理
const loading = ref(false);
const books = ref<Book[]>([]);
const selectedBookId = ref<number | undefined>(undefined);
const searchKeyword = ref('');
const selectedTables = ref<string[]>([]);
const currentPage = ref(1);
const pageSize = ref(9);
const jumpPage = ref(1);
const showPreview = ref(false);
const previewTableData = ref<TableData | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);

// 获取后端地址
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 获取图片URL（处理相对路径）
const getImageUrl = (url: string): string => {
  if (!url) return '';
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 如果是相对路径，拼接后端地址
  if (url.startsWith('/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return `${BACKEND_BASE_URL}/${url}`;
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+';
};

// 所有表格数据
const allTables = ref<TableData[]>([]);

// 加载书籍列表
const loadBooks = async () => {
  try {
    const response = await bookApi.getAllBooks();
    books.value = response.books || [];
  } catch (error: any) {
    console.error('加载书籍列表失败:', error);
    ElMessage.error('加载书籍列表失败: ' + (error.message || '未知错误'));
  }
};

// 加载表格数据
const loadTables = async () => {
  if (selectedBookId.value === undefined) {
    allTables.value = [];
    return;
  }

  loading.value = true;
  try {
    // 1. 获取所有表格文件夹
    const folderSearchResult = await fileApi.searchFiles({
      keyword: '',
      fileType: 'table_folder',
      bookId: selectedBookId.value,
      page: 1,
      size: 1000,  // 获取所有文件夹
    });

    const tableFolders = folderSearchResult.files || [];
    console.log('找到表格文件夹:', tableFolders);

    // 2. 对于每个文件夹，获取其中的表格列表
    const allTablesList: TableData[] = [];
    
    for (const folder of tableFolders) {
      const property = folder.property as string;
      if (!property) continue;

      try {
        const folderData = await fileApi.getTableFolder(property, selectedBookId.value);
        const tables = folderData.tables || [];
        
        // 将表格添加到列表（表格以图片形式存在）
        tables.forEach((table, index) => {
          const fileExtension = table.name.split('.').pop()?.toLowerCase() || '';
          // 表格实际上是图片，根据文件扩展名判断类型
          let fileType = 'Image';
          if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
            fileType = 'Image';
          } else if (['xlsx', 'xls'].includes(fileExtension)) {
            fileType = 'Excel';
          } else if (fileExtension === 'csv') {
            fileType = 'CSV';
          }

          allTablesList.push({
            id: `${property}_${table.name}_${index}`,  // 唯一ID
            name: table.name,
            folderName: property,
            property: property,
            type: fileType,
            size: table.size,
            lastModified: table.lastModified,
            url: table.url,
            bookId: selectedBookId.value,
          });
        });
      } catch (error: any) {
        console.warn(`加载文件夹 ${property} 的表格失败:`, error);
        // 继续处理其他文件夹
      }
    }

    allTables.value = allTablesList;
    console.log('加载的表格总数:', allTables.value.length);
  } catch (error: any) {
    console.error('加载表格失败:', error);
    ElMessage.error('加载表格失败: ' + (error.message || '未知错误'));
    allTables.value = [];
  } finally {
    loading.value = false;
  }
};

// 书籍选择变化
const handleBookChange = () => {
  currentPage.value = 1;
  loadTables();
};

// 过滤表格
const filteredTables = computed(() => {
  let result = allTables.value;
  
  if (searchKeyword.value) {
    result = result.filter(table => 
      table.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      table.folderName.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  
  return result;
});

// 分页计算
const totalTables = computed(() => filteredTables.value.length);
const totalPages = computed(() => Math.ceil(totalTables.value / pageSize.value));
const paginatedTables = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTables.value.slice(start, end);
});

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
const isSelected = (id: string) => selectedTables.value.includes(id);

const toggleSelect = (id: string) => {
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

// 分页
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    jumpPage.value = page;
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

const viewTable = async (table: TableData) => {
  previewTableData.value = table;
  showPreview.value = true;
  previewLoading.value = false; // 图片预览不需要加载，直接显示
  previewError.value = null;
};

const closePreview = () => {
  showPreview.value = false;
  previewTableData.value = null;
  previewError.value = null;
};

const downloadTable = async (table: TableData | null) => {
  if (!table) return;
  
  try {
    const blob = await fileApi.downloadFile(table.property, 'tables', table.name);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = table.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success(`下载 ${table.name} 成功`);
  } catch (error: any) {
    console.error('下载表格失败:', error);
    ElMessage.error('下载失败: ' + (error.message || '未知错误'));
  }
};

const deleteTable = async (table: TableData) => {
  try {
    await ElMessageBox.confirm('确定要删除这个表格吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    ElMessage.success('删除成功');
    allTables.value = allTables.value.filter(t => t.id !== table.id);
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
    allTables.value = allTables.value.filter(table => !selectedTables.value.includes(table.id));
    selectedTables.value = [];
  } catch {
    // 用户取消
  }
};

// 工具函数
const getTableIcon = (type: string) => {
  const icons: Record<string, string> = {
    'Image': '🖼️',
    'Excel': '📊',
    'CSV': '📋',
    'JSON': '📄'
  };
  return icons[type] || '📝';
};

const formatSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '未知大小';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return '未知时间';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 初始化
onMounted(async () => {
  await loadBooks();
  // 默认选择第一本书
  if (books.value.length > 0) {
    selectedBookId.value = books.value[0].id;
    await loadTables();
  }
});
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

.book-select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.book-select:focus {
  outline: none;
  border-color: #667eea;
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

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  font-size: 14px;
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

.card-icon.icon-Image {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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

.type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.type-badge.type-Image {
  background: #f3e8ff;
  color: #7c3aed;
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
  max-width: 900px;
  max-height: 90vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.preview-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
  flex: 1;
  padding-right: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  overflow-y: auto;
  flex: 1;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner-small {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.preview-loading p {
  color: #6b7280;
  font-size: 14px;
}

.preview-error {
  text-align: center;
  padding: 40px 20px;
  color: #ef4444;
}

.preview-error p {
  margin-bottom: 20px;
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

.table-preview-section {
  margin-bottom: 24px;
}

.table-preview-section h4 {
  font-size: 15px;
  color: #374151;
  margin: 0 0 16px 0;
}

.table-container {
  max-height: 400px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table thead {
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.preview-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-table tbody tr:hover {
  background: #f9fafb;
}

.preview-note {
  margin-top: 12px;
  padding: 12px;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
}

.preview-note p {
  margin: 0;
  font-size: 13px;
  color: #b45309;
}

.preview-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
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
  
  .preview-content {
    width: 95%;
    max-height: 95vh;
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
