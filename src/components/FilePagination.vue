<template>
  <div class="file-management-modern">
    <!-- 顶部标题和操作栏 -->
    <div class="header-section">
      <div class="header-left">
        <h2 class="page-title">我的文档</h2>
        <div class="breadcrumb">
          <span class="breadcrumb-item">📁 根目录</span>
        </div>
      </div>
      <div class="header-right">
        <button class="modern-btn btn-primary" @click="handleUpload">
          <span class="btn-icon">📤</span>
          <span>上传</span>
        </button>
        <button class="modern-btn btn-secondary" @click="handleNewFolder">
          <span class="btn-icon">📁</span>
          <span>新建文件夹</span>
        </button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-section">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchKeyword" 
          type="text" 
          class="search-input" 
          placeholder="请输入文件名或文件夹名进行搜索"
          @input="handleSearch"
        />
      </div>
      
      <div class="filter-controls">
        <select v-model="fileTypeFilter" class="filter-select" @change="handleSearch">
          <option value="">文件类型</option>
          <option value="pdf">PDF</option>
          <option value="md">Markdown</option>
          <option value="image">图片</option>
        </select>
        
        <button class="filter-btn" @click="resetSearch">
          <span>🔄</span>
          <span>重置</span>
        </button>
        
        <button 
          class="filter-btn btn-delete" 
          :disabled="selectedFiles.length === 0"
          @click="batchDelete"
        >
          <span>🗑️</span>
          <span>批量删除</span>
        </button>
      </div>
    </div>
    
    <!-- 文件表格（现代化设计） -->
    <div class="table-container" v-loading="loading">
      <table class="modern-table">
        <thead>
          <tr>
            <th class="col-checkbox">
              <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" />
            </th>
            <th class="col-name" @click="sortBy('file_path')">
              <span>文件名称</span>
              <span class="sort-icon">{{ getSortIcon('file_path') }}</span>
            </th>
            <th class="col-time" @click="sortBy('upload_time')">
              <span>修改时间</span>
              <span class="sort-icon">{{ getSortIcon('upload_time') }}</span>
            </th>
            <th class="col-type" @click="sortBy('file_type')">
              <span>类型</span>
              <span class="sort-icon">{{ getSortIcon('file_type') }}</span>
            </th>
            <th class="col-size">大小</th>
            <th class="col-actions">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="files.length === 0">
            <td colspan="6" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📭</span>
                <p>暂无数据</p>
              </div>
            </td>
          </tr>
          <tr 
            v-for="file in files" 
            :key="file.id"
            class="table-row"
            :class="{ 'selected': isSelected(file.id) }"
          >
            <td class="col-checkbox">
              <input 
                type="checkbox" 
                :checked="isSelected(file.id)"
                @change="toggleSelect(file.id)"
              />
            </td>
            <td class="col-name">
              <div class="file-name-wrapper">
                <span class="file-icon">{{ getFileIcon(file.file_type) }}</span>
                <span class="file-name" :title="file.file_path">{{ getFileName(file.file_path) }}</span>
              </div>
            </td>
            <td class="col-time">{{ formatDate(file.upload_time) }}</td>
            <td class="col-type">
              <span class="type-badge" :class="'type-' + file.file_type">
                {{ getFileTypeText(file.file_type) }}
              </span>
            </td>
            <td class="col-size">--</td>
            <td class="col-actions">
              <div class="action-buttons-modern">
                <button class="action-btn" @click="showDetails(file.id)" title="查看">
                  👁️
                </button>
                <button class="action-btn" @click="editFile(file)" title="编辑">
                  ✏️
                </button>
                <button class="action-btn btn-danger" @click="confirmDelete(file.id)" title="删除">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 分页控件（现代化） -->
    <div class="pagination-modern">
      <div class="pagination-info">
        <span>共 {{ total }} 条记录</span>
        <select v-model="pageSize" class="page-size-select" @change="handleSizeChange">
          <option :value="10">10/page</option>
          <option :value="20">20/page</option>
          <option :value="50">50/page</option>
          <option :value="100">100/page</option>
        </select>
      </div>
      <div class="pagination-controls">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
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
        <button 
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

// 路由
const router = useRouter();

// 状态变量
const files = ref<any[]>([]); 
const searchKeyword = ref('');
const property = ref('');
const fileTypeFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const selectedFiles = ref<number[]>([]);
const deleteDialogVisible = ref(false);
const fileIdToDelete = ref<number | null>(null);
const jumpPage = ref(1);
const sortField = ref('');
const sortOrder = ref<'asc' | 'desc'>('desc');

// 定义API响应类型
interface FileData {
  id: number;
  property: string;
  file_type: string;
  file_path: string;
  upload_time?: string;
  [key: string]: any;
}

interface ApiResponse {
  content?: FileData[];
  images?: FileData[];
  totalRecords: number;
}

// 获取文件列表
const fetchFiles = async () => {
  loading.value = true;
  try {
    // 构建查询参数
    const params = new URLSearchParams();
    params.append('page', currentPage.value.toString());
    params.append('size', pageSize.value.toString());
    
    if (property.value) {
      params.append('property', property.value);
    }
    
    if (fileTypeFilter.value) {
      params.append('fileType', fileTypeFilter.value);
    }
    
    const url = `http://localhost:8080/api/files${property.value ? `/${property.value}` : ''}?${params.toString()}`;
    const response = await axios.get<ApiResponse>(url);
    const data = response.data;
    
    // 合并文章和图片
    files.value = [...(data.content || []), ...(data.images || [])];
    total.value = data.totalRecords || 0;
  } catch (error) {
    console.error('获取文件列表失败', error);
    ElMessage.error('获取文件列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
  fetchFiles();
};

// 重置搜索
const resetSearch = () => {
  property.value = '';
  fileTypeFilter.value = '';
  currentPage.value = 1;
  fetchFiles();
};

// 刷新列表
const refreshList = () => {
  fetchFiles();
};

// 页面大小变化
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchFiles();
};

// 选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedFiles.value = selection;
};

// 批量删除
const batchDelete = () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请选择要删除的文件');
    return;
  }
  
  deleteDialogVisible.value = true;
};

// 确认删除单个文件
const confirmDelete = (id: number) => {
  fileIdToDelete.value = id;
  deleteDialogVisible.value = true;
};

// 执行删除操作
const confirmDeleteAction = async () => {
  try {
    if (fileIdToDelete.value !== null) {
      // 删除单个文件
      await deleteFile(fileIdToDelete.value);
    } else {
      // 批量删除
      const ids = selectedFiles.value.map(file => file.id);
      await Promise.all(ids.map(id => deleteFile(id, false)));
      ElMessage.success(`成功删除 ${ids.length} 个文件`);
    }
    
    // 刷新列表
    fetchFiles();
  } catch (error) {
    console.error('删除文件失败', error);
    ElMessage.error('删除文件失败');
  } finally {
    // 重置状态
    deleteDialogVisible.value = false;
    fileIdToDelete.value = null;
  }
};

// 删除文件
const deleteFile = async (fileId: number, showMessage = true) => {
  try {
    interface DeleteResponse {
      message?: string;
      [key: string]: any;
    }
    
    const response = await axios.delete<DeleteResponse>(`http://localhost:8080/api/files/${fileId}`);
    if (response.status === 200) {
      if (showMessage) {
        ElMessage.success('文件删除成功');
      }
      return true;
    } else {
      throw new Error(response.data?.message || '删除失败');
    }
  } catch (error: any) {
    console.error('删除文件时发生错误', error);
    if (showMessage) {
      ElMessage.error(`删除失败: ${error.message || '未知错误'}`);
    }
    throw error;
  }
};

// 跳转到详情页面
const showDetails = (fileId: number) => {
  router.push({
    name: 'fileDetails',
    params: { id: fileId }
  });
};

// 跳转到编辑页面
const editFile = (file: any) => {
  if (file.id) {
    console.log('Navigating to FileEdit:', file.id);
    router.push({ name: 'FileEdit', params: { id: String(file.id) } });
  } else {
    ElMessage.error('无效的文件ID');
  }
};

// 格式化日期
const formatDate = (dateString: string | null) => {
  if (!dateString) return '未知';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

// 获取文件类型标签样式
const getFileTypeTag = (fileType: string) => {
  const type = fileType?.toLowerCase();
  if (!type) return '';
  
  if (type === 'pdf') return 'danger';
  if (type === 'md' || type === 'markdown') return 'success';
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(type)) return 'warning';
  return 'info';
};

// === 新增的辅助方法 ===

// 获取文件图标
const getFileIcon = (fileType: string) => {
  const type = fileType?.toLowerCase();
  if (!type) return '📄';
  
  if (type === 'pdf') return '📕';
  if (type === 'md' || type === 'markdown') return '📝';
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(type)) return '🖼️';
  if (type.includes('video') || ['mp4', 'avi', 'mov'].includes(type)) return '🎬';
  if (type.includes('audio') || ['mp3', 'wav', 'flac'].includes(type)) return '🎵';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) return '📦';
  return '📄';
};

// 获取文件名
const getFileName = (filePath: string) => {
  if (!filePath) return '';
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
};

// 获取文件类型文本
const getFileTypeText = (fileType: string) => {
  const type = fileType?.toLowerCase();
  if (!type) return '文件类';
  
  if (type === 'pdf') return 'PDF文档';
  if (type === 'md' || type === 'markdown') return 'Markdown';
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(type)) return '图片';
  return '文件类';
};

// 选择/取消选择文件
const toggleSelect = (fileId: number) => {
  const index = selectedFiles.value.indexOf(fileId);
  if (index > -1) {
    selectedFiles.value.splice(index, 1);
  } else {
    selectedFiles.value.push(fileId);
  }
};

// 检查文件是否被选中
const isSelected = (fileId: number) => {
  return selectedFiles.value.includes(fileId);
};

// 全选/取消全选
const isAllSelected = computed(() => {
  return files.value.length > 0 && selectedFiles.value.length === files.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedFiles.value = [];
  } else {
    selectedFiles.value = files.value.map(f => f.id);
  }
};

// 排序功能
const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
  // 这里可以添加排序逻辑
};

const getSortIcon = (field: string) => {
  if (sortField.value !== field) return '';
  return sortOrder.value === 'asc' ? '↑' : '↓';
};

// 分页相关计算
const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value);
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

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchFiles();
  }
};

const jumpToPage = () => {
  if (jumpPage.value >= 1 && jumpPage.value <= totalPages.value) {
    currentPage.value = jumpPage.value;
    fetchFiles();
  }
};

// 上传和新建文件夹（占位方法）
const handleUpload = () => {
  ElMessage.info('上传功能开发中...');
};

const handleNewFolder = () => {
  ElMessage.info('新建文件夹功能开发中...');
};

// 初始化
onMounted(() => {
  fetchFiles();
});
</script>

<style scoped>
.file-management {
  width: 100%;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-bar {
  display: flex;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 确保表格内容不会溢出 */
:deep(.el-table) {
  width: 100% !important;
  table-layout: fixed;
}

:deep(.el-button--small) {
  padding: 5px 10px;
  font-size: 12px;
}

:deep(.el-tag--small) {
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
}

/* === 现代化设计样式 === */

/* 主容器 */
.file-management-modern {
  width: 100%;
  min-height: calc(100vh - 200px);
  background: #f5f7fa;
  padding: 24px;
}

/* 顶部标题栏 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  font-size: 14px;
  color: #6b7280;
}

.header-right {
  display: flex;
  gap: 12px;
}

.modern-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modern-btn .btn-icon {
  font-size: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* 搜索和筛选栏 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-input-wrapper {
  flex: 1;
  max-width: 400px;
  position: relative;
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
  color: #374151;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.filter-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  border-color: #d1d5db;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.filter-btn.btn-delete {
  color: #ef4444;
}

.filter-btn.btn-delete:hover {
  background: #fef2f2;
  border-color: #fecaca;
}

.filter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 表格容器 */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table thead {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.modern-table thead th {
  padding: 16px 20px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.modern-table thead th:hover {
  background: #f3f4f6;
}

.modern-table thead th .sort-icon {
  margin-left: 6px;
  color: #9ca3af;
}

.modern-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.modern-table tbody tr:hover {
  background: #f9fafb;
}

.modern-table tbody tr.selected {
  background: #eff6ff;
}

.modern-table tbody td {
  padding: 16px 20px;
  font-size: 14px;
  color: #374151;
}

/* 列样式 */
.col-checkbox {
  width: 48px;
  text-align: center;
}

.col-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.col-name {
  min-width: 300px;
}

.file-name-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-time {
  min-width: 180px;
  color: #6b7280;
}

.col-type {
  min-width: 120px;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-badge.type-pdf {
  background: #fee2e2;
  color: #dc2626;
}

.type-badge.type-md,
.type-badge.type-markdown {
  background: #dcfce7;
  color: #16a34a;
}

.type-badge.type-image {
  background: #fef3c7;
  color: #d97706;
}

.col-size {
  min-width: 100px;
  color: #6b7280;
}

.col-actions {
  min-width: 150px;
}

.action-buttons-modern {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 10px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.action-btn.btn-danger:hover {
  background: #fee2e2;
}

.empty-state {
  padding: 80px 20px !important;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.3;
}

.empty-content p {
  font-size: 16px;
  color: #9ca3af;
  margin: 0;
}

/* 分页样式 */
.pagination-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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

.page-input:focus {
  outline: none;
  border-color: #667eea;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input-wrapper {
    max-width: none;
  }
  
  .filter-controls {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .file-management-modern {
    padding: 16px;
  }
  
  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .modern-table {
    font-size: 13px;
  }
  
  .modern-table thead th,
  .modern-table tbody td {
    padding: 12px;
  }
  
  .pagination-modern {
    flex-direction: column;
    gap: 16px;
  }
}
</style>