<template>
  <div class="image-gallery-component">
    <div class="content-wrapper">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="action-btn btn-upload" @click="handleUpload">
            <span class="btn-icon">📤</span>
            <span>上传图片</span>
          </button>
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchKeyword" 
              type="text" 
              class="search-input" 
              placeholder="搜索图片名称..."
              @input="handleSearch"
            />
          </div>
          <select v-model="categoryFilter" class="filter-select" @change="handleFilter">
            <option value="">全部分类</option>
            <option value="地貌">地貌图片</option>
            <option value="地质">地质图片</option>
            <option value="矿物">矿物图片</option>
            <option value="化石">化石图片</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="toolbar-right">
          <div class="view-switcher">
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
              title="网格视图"
            >
              ⊞
            </button>
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
              title="列表视图"
            >
              ☰
            </button>
          </div>
          <button 
            class="delete-btn"
            :disabled="selectedImages.length === 0"
            @click="batchDelete"
          >
            <span>🗑️</span>
            <span>批量删除 {{ selectedImages.length > 0 ? `(${selectedImages.length})` : '' }}</span>
          </button>
        </div>
      </div>

      <!-- 图片网格视图 -->
      <div v-if="viewMode === 'grid'" class="image-grid">
        <div v-if="filteredImages.length === 0" class="empty-state">
          <span class="empty-icon">🖼️</span>
          <p>暂无图片</p>
          <button class="empty-action-btn" @click="handleUpload">
            <span>📤</span>
            <span>上传第一张图片</span>
          </button>
        </div>
        <div 
          v-for="image in filteredImages" 
          :key="image.id"
          class="image-card"
          :class="{ selected: isSelected(image.id) }"
        >
          <div class="image-checkbox">
            <input 
              type="checkbox" 
              :checked="isSelected(image.id)"
              @change="toggleSelect(image.id)"
            />
          </div>
          <div class="image-preview" @click="previewImage(image)">
            <img :src="image.url" :alt="image.name" />
            <div class="image-overlay">
              <button class="overlay-btn" @click.stop="previewImage(image)">
                👁️ 预览
              </button>
              <button class="overlay-btn" @click.stop="downloadImage(image)">
                ⬇️ 下载
              </button>
            </div>
          </div>
          <div class="image-info">
            <h4 class="image-name" :title="image.name">{{ image.name }}</h4>
            <div class="image-meta">
              <span class="meta-item">{{ image.category }}</span>
              <span class="meta-item">{{ formatSize(image.size) }}</span>
            </div>
            <div class="image-date">{{ formatDate(image.uploadTime) }}</div>
            <div class="image-actions">
              <button class="action-icon-btn" @click="editImage(image)" title="编辑">
                ✏️
              </button>
              <button class="action-icon-btn" @click="deleteImage(image.id)" title="删除">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 图片列表视图 -->
      <div v-if="viewMode === 'list'" class="image-list">
        <table class="list-table">
          <thead>
            <tr>
              <th class="col-checkbox">
                <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" />
              </th>
              <th class="col-preview">预览</th>
              <th class="col-name">图片名称</th>
              <th class="col-category">分类</th>
              <th class="col-size">大小</th>
              <th class="col-date">上传时间</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredImages.length === 0">
              <td colspan="7" class="empty-row">
                <div class="empty-state-inline">
                  <span class="empty-icon">🖼️</span>
                  <p>暂无图片</p>
                </div>
              </td>
            </tr>
            <tr 
              v-for="image in filteredImages" 
              :key="image.id"
              class="list-row"
              :class="{ selected: isSelected(image.id) }"
            >
              <td class="col-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isSelected(image.id)"
                  @change="toggleSelect(image.id)"
                />
              </td>
              <td class="col-preview">
                <div class="preview-thumbnail" @click="previewImage(image)">
                  <img :src="image.url" :alt="image.name" />
                </div>
              </td>
              <td class="col-name">
                <div class="name-cell">
                  <span class="name-icon">🖼️</span>
                  <span class="name-text" :title="image.name">{{ image.name }}</span>
                </div>
              </td>
              <td class="col-category">
                <span class="category-badge" :class="'category-' + image.category">
                  {{ image.category }}
                </span>
              </td>
              <td class="col-size">{{ formatSize(image.size) }}</td>
              <td class="col-date">{{ formatDate(image.uploadTime) }}</td>
              <td class="col-actions">
                <div class="action-buttons">
                  <button class="action-icon-btn" @click="previewImage(image)" title="预览">👁️</button>
                  <button class="action-icon-btn" @click="downloadImage(image)" title="下载">⬇️</button>
                  <button class="action-icon-btn" @click="editImage(image)" title="编辑">✏️</button>
                  <button class="action-icon-btn" @click="deleteImage(image.id)" title="删除">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <div class="pagination-info">
          <span>共 {{ totalImages }} 张图片</span>
          <select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
            <option :value="12">12/page</option>
            <option :value="24">24/page</option>
            <option :value="48">48/page</option>
            <option :value="96">96/page</option>
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

    <!-- 图片预览模态框 -->
    <div v-if="showPreview" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <button class="preview-close" @click="closePreview">✕</button>
        <img :src="previewImageData?.url" :alt="previewImageData?.name" />
        <div class="preview-info">
          <h3>{{ previewImageData?.name }}</h3>
          <p>{{ previewImageData?.category }} · {{ formatSize(previewImageData?.size) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 图片数据接口
interface ImageData {
  id: number;
  name: string;
  url: string;
  category: string;
  size: number;
  uploadTime: string;
}

// 状态管理
const searchKeyword = ref('');
const categoryFilter = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const selectedImages = ref<number[]>([]);
const currentPage = ref(1);
const pageSize = ref(12);
const jumpPage = ref(1);
const showPreview = ref(false);
const previewImageData = ref<ImageData | null>(null);

// 模拟图片数据
const images = ref<ImageData[]>([
  {
    id: 1,
    name: '亚洲地貌圈及其板块造貌构造纲要.jpg',
    url: '/images/亚洲地貌圈及其板块造貌构造纲要.jpg',
    category: '地貌',
    size: 2548000,
    uploadTime: '2025-11-09 10:30:00'
  },
  {
    id: 2,
    name: '板块构造与地貌形迹.jpg',
    url: '/images/板块构造与地貌形迹.jpg',
    category: '地质',
    size: 1850000,
    uploadTime: '2025-11-08 14:20:00'
  },
  {
    id: 3,
    name: '地学新两论上篇.jpg',
    url: '/images/地学新两论 上篇 板块造貌构造学-兼论板块学说新发展.jpg',
    category: '地质',
    size: 3200000,
    uploadTime: '2025-11-07 09:15:00'
  },
]);

// 过滤图片
const filteredImages = computed(() => {
  let result = images.value;
  
  if (searchKeyword.value) {
    result = result.filter(img => 
      img.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  
  if (categoryFilter.value) {
    result = result.filter(img => img.category === categoryFilter.value);
  }
  
  return result;
});

// 分页计算
const totalImages = computed(() => filteredImages.value.length);
const totalPages = computed(() => Math.ceil(totalImages.value / pageSize.value));
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
const isSelected = (id: number) => selectedImages.value.includes(id);
const isAllSelected = computed(() => 
  filteredImages.value.length > 0 && selectedImages.value.length === filteredImages.value.length
);

const toggleSelect = (id: number) => {
  const index = selectedImages.value.indexOf(id);
  if (index > -1) {
    selectedImages.value.splice(index, 1);
  } else {
    selectedImages.value.push(id);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedImages.value = [];
  } else {
    selectedImages.value = filteredImages.value.map(img => img.id);
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

// 图片操作
const handleUpload = () => {
  ElMessage.info('上传功能开发中...');
};

const previewImage = (image: ImageData) => {
  previewImageData.value = image;
  showPreview.value = true;
};

const closePreview = () => {
  showPreview.value = false;
  previewImageData.value = null;
};

const downloadImage = (image: ImageData) => {
  ElMessage.success(`下载 ${image.name}`);
};

const editImage = (image: ImageData) => {
  ElMessage.info(`编辑 ${image.name}`);
};

const deleteImage = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这张图片吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    ElMessage.success('删除成功');
    images.value = images.value.filter(img => img.id !== id);
  } catch {
    // 用户取消
  }
};

const batchDelete = async () => {
  if (selectedImages.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedImages.value.length} 张图片吗？`, 
      '批量删除', 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    ElMessage.success(`成功删除 ${selectedImages.value.length} 张图片`);
    images.value = images.value.filter(img => !selectedImages.value.includes(img.id));
    selectedImages.value = [];
  } catch {
    // 用户取消
  }
};

// 工具函数
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
.image-gallery-component {
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

.btn-upload {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.btn-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.search-wrapper {
  position: relative;
  flex: 1;
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
  align-items: center;
}

.view-switcher {
  display: flex;
  gap: 4px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
}

.view-btn {
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.view-btn:hover {
  color: #374151;
}

.view-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

/* 网格视图 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  min-height: 400px;
}

.image-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.image-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
}

.image-card.selected {
  border-color: #667eea;
  background: #eff6ff;
}

.image-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
}

.image-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f3f4f6;
  cursor: pointer;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-card:hover .image-preview img {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.overlay-btn {
  padding: 8px 16px;
  border: none;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.overlay-btn:hover {
  transform: scale(1.05);
}

.image-info {
  padding: 16px;
}

.image-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 12px;
  color: #6b7280;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
}

.image-date {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.image-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-icon-btn {
  padding: 6px 10px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-icon-btn:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

/* 列表视图 */
.image-list {
  overflow-x: auto;
}

.list-table {
  width: 100%;
  border-collapse: collapse;
}

.list-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.list-table thead th {
  padding: 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.list-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.list-table tbody tr:hover {
  background: #f9fafb;
}

.list-table tbody tr.selected {
  background: #eff6ff;
}

.list-table tbody td {
  padding: 16px;
}

.col-checkbox {
  width: 48px;
  text-align: center;
}

.col-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.col-preview {
  width: 80px;
}

.preview-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.preview-thumbnail:hover {
  transform: scale(1.1);
}

.preview-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-icon {
  font-size: 20px;
}

.name-text {
  font-weight: 500;
  color: #1f2937;
}

.category-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.category-badge.category-地貌 {
  background: #dbeafe;
  color: #1e40af;
}

.category-badge.category-地质 {
  background: #dcfce7;
  color: #15803d;
}

.category-badge.category-矿物 {
  background: #fef3c7;
  color: #b45309;
}

.category-badge.category-化石 {
  background: #fce7f3;
  color: #be123c;
}

.action-buttons {
  display: flex;
  gap: 8px;
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

.empty-state-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.empty-state-inline .empty-icon {
  font-size: 64px;
}

.empty-state-inline p {
  margin: 0;
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
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.preview-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.preview-close:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.preview-content img {
  max-width: 100%;
  max-height: 80vh;
  display: block;
}

.preview-info {
  padding: 20px;
  background: white;
}

.preview-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1f2937;
}

.preview-info p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
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
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 16px;
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

