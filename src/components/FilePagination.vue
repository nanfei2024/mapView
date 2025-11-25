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
        <select 
          v-model="selectedBookId" 
          class="book-select"
          @change="handleBookChange"
        >
          <option :value="undefined">所有书籍</option>
          <option 
            v-for="book in books" 
            :key="book.id" 
            :value="book.id"
          >
            {{ book.title || book.name }}
          </option>
        </select>
        <button class="modern-btn btn-primary" @click="showUploadDialog = true">
          <span class="btn-icon">📤</span>
          <span>上传</span>
        </button>
        <button class="modern-btn btn-secondary" @click="showCreateBookDialog = true">
          <span class="btn-icon">📚</span>
          <span>新建书籍</span>
        </button>
      </div>
    </div>

    <!-- 搜索和筛选栏（只在选择具体书籍时显示） -->
    <div v-if="selectedBookId !== undefined" class="filter-section">
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
          <option value="">所有类型</option>
          <option value="article">文章</option>
          <option value="image">图片</option>
          <option value="text">文本</option>
          <option value="table_folder">表格文件夹</option>
          <option value="img_folder">图片文件夹</option>
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
    
    <!-- 书籍列表（当选择"所有书籍"时显示） -->
    <div v-if="selectedBookId === undefined" class="table-container" v-loading="loading">
      <div class="books-grid">
        <div 
          v-for="book in books" 
          :key="book.id"
          class="book-card"
          @click="selectBook(book.id)"
        >
          <div class="book-icon">📚</div>
          <div class="book-info">
            <h3 class="book-title">{{ book.title || book.name }}</h3>
            <p class="book-author">{{ book.author || '未知作者' }}</p>
            <p class="book-description">{{ book.description || '暂无描述' }}</p>
          </div>
          <div class="book-actions">
            <button class="book-action-btn" @click.stop="viewBookFiles(book.id)" title="查看文件">
              👁️
            </button>
            <button class="book-action-btn" @click.stop="editBook(book)" title="编辑">
              ✏️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件表格（当选择具体书籍时显示） -->
    <div v-else class="table-container" v-loading="loading">
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
                <span class="file-icon">{{ getFileIconForItem(file) }}</span>
                <span class="file-name" :title="getDisplayName(file)">{{ getDisplayName(file) }}</span>
              </div>
            </td>
            <td class="col-time">{{ formatDate(file.upload_time || null) }}</td>
            <td class="col-type">
              <span class="type-badge" :class="'type-' + file.file_type">
                {{ getFileTypeTextForItem(file) }}
              </span>
            </td>
            <td class="col-size">{{ formatFileSize(file) }}</td>
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
    
    <!-- 分页控件（现代化，只在显示文件列表时显示） -->
    <div v-if="selectedBookId !== undefined" class="pagination-modern">
      <div class="pagination-info">
        <span>共 {{ total }} 条记录</span>
        <select v-model="pageSize" class="page-size-select" @change="handleSizeChange($event)">
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

    <!-- 创建书籍对话框 -->
    <el-dialog
      v-model="showCreateBookDialog"
      title="创建新书籍"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newBookForm" label-width="80px">
        <el-form-item label="书籍名称" required>
          <el-input v-model="newBookForm.name" placeholder="请输入书籍名称（唯一标识）" />
        </el-form-item>
        <el-form-item label="书籍标题" required>
          <el-input v-model="newBookForm.title" placeholder="请输入书籍标题" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="newBookForm.author" placeholder="请输入作者" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newBookForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入书籍描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateBookDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateBook" :loading="creatingBook">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 上传文件对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传文件"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="uploadForm" label-width="120px">
        <el-form-item label="选择书籍" required>
          <el-select
            v-model="uploadForm.bookId"
            placeholder="请选择书籍"
            style="width: 100%"
            @change="handleUploadBookChange"
          >
            <el-option
              v-for="book in books"
              :key="book.id"
              :label="book.title || book.name"
              :value="book.id"
            />
          </el-select>
          <div style="margin-top: 8px;">
            <el-button type="text" @click="showCreateBookDialog = true; showUploadDialog = false">
              + 创建新书籍
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="上传类型" required>
          <el-radio-group v-model="uploadForm.uploadType" @change="handleUploadTypeChange">
            <el-radio label="files">普通文件（PDF、MD等）</el-radio>
            <el-radio label="imageFolder">图片文件夹</el-radio>
            <el-radio label="tableFolder">表格文件夹</el-radio>
            <el-radio label="summary">摘要文件</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 普通文件上传 -->
        <template v-if="uploadForm.uploadType === 'files'">
          <el-form-item label="选择文件" required>
            <el-upload
              ref="filesUploadRef"
              :auto-upload="false"
              :on-change="handleFilesChange"
              :file-list="uploadForm.files"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md"
            >
              <el-button type="primary">选择文件</el-button>
              <template #tip>
                <div class="el-upload__tip">支持 PDF、DOC、DOCX、TXT、MD 格式</div>
              </template>
            </el-upload>
          </el-form-item>
        </template>

        <!-- 图片文件夹上传 -->
        <template v-if="uploadForm.uploadType === 'imageFolder'">
          <el-form-item label="文件夹名称" required>
             <el-input
               v-model="uploadForm.folderName"
               placeholder="例如：第一章图片 或 chapter-1"
             />
          </el-form-item>
          <el-form-item label="选择图片" required>
            <el-upload
              ref="imageFolderUploadRef"
              :auto-upload="false"
              :on-change="handleImageFolderChange"
              :file-list="uploadForm.imageFiles"
              multiple
              accept=".png,.jpg,.jpeg,.gif,.bmp"
            >
              <el-button type="primary">选择图片</el-button>
              <template #tip>
                <div class="el-upload__tip">支持 PNG、JPG、JPEG、GIF、BMP 格式</div>
              </template>
            </el-upload>
          </el-form-item>
        </template>

        <!-- 表格文件夹上传 -->
        <template v-if="uploadForm.uploadType === 'tableFolder'">
          <el-form-item label="文件夹名称" required>
             <el-input
               v-model="uploadForm.folderName"
               placeholder="例如：第一章表格 或 tables-第一章"
             />
          </el-form-item>
          <el-form-item label="选择表格" required>
            <el-upload
              ref="tableFolderUploadRef"
              :auto-upload="false"
              :on-change="handleTableFolderChange"
              :file-list="uploadForm.tableFiles"
              multiple
              accept=".xlsx,.xls,.csv"
            >
              <el-button type="primary">选择表格</el-button>
              <template #tip>
                <div class="el-upload__tip">支持 XLSX、XLS、CSV 格式</div>
              </template>
            </el-upload>
          </el-form-item>
        </template>

        <!-- 摘要文件上传 -->
        <template v-if="uploadForm.uploadType === 'summary'">
          <el-form-item label="章节属性" required>
            <el-input
              v-model="uploadForm.property"
              placeholder="例如：3.1（章节编号）"
            />
          </el-form-item>
          <el-form-item label="选择摘要文件" required>
            <el-upload
              ref="summaryUploadRef"
              :auto-upload="false"
              :on-change="handleSummaryChange"
              :file-list="uploadForm.summaryFile"
              accept=".txt"
            >
              <el-button type="primary">选择文件</el-button>
              <template #tip>
                <div class="el-upload__tip">支持 TXT 格式</div>
              </template>
            </el-upload>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelUpload">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmitUpload"
          :loading="uploading"
          :disabled="!canSubmitUpload"
        >
          上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import fileApi, { type FileItem, type FileListResponse, type FileSearchParams } from '../api/fileApi';
import { bookApi, type Book } from '../api/bookApi';

// 路由
const router = useRouter();

// 状态变量
const files = ref<FileItem[]>([]); 
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
const selectedBookId = ref<number | undefined>(undefined); // 当前选择的书籍ID
const books = ref<Book[]>([]); // 书籍列表

// 上传对话框相关状态
const showUploadDialog = ref(false);
const showCreateBookDialog = ref(false);
const creatingBook = ref(false);
const uploading = ref(false);

// 创建书籍表单
const newBookForm = ref({
  name: '',
  title: '',
  author: '',
  description: ''
});

// 上传表单
const uploadForm = ref({
  bookId: undefined as number | undefined,
  uploadType: 'files' as 'files' | 'imageFolder' | 'tableFolder' | 'summary',
  files: [] as any[],
  imageFiles: [] as any[],
  tableFiles: [] as any[],
  summaryFile: [] as any[],
  folderName: '',
  property: ''
});

// 上传组件引用
const filesUploadRef = ref();
const imageFolderUploadRef = ref();
const tableFolderUploadRef = ref();
const summaryUploadRef = ref();

// 获取文件列表
const fetchFiles = async () => {
  // 如果选择的是"所有书籍"，不获取文件列表
  if (selectedBookId.value === undefined) {
    return;
  }

  loading.value = true;
  try {
    let data: FileListResponse;

    // 根据文件类型筛选，使用不同的查询方式
    // 注意：后端搜索接口的 keyword 是必填参数，即使为空也要传递
    if (fileTypeFilter.value === 'img_folder') {
      // 图片文件夹：通过搜索 fileType="img_folder" 获取所有图片文件夹
      const searchParams: FileSearchParams = {
        keyword: searchKeyword.value.trim() || '', // 必填，空字符串也可以
        fileType: 'img_folder',
        bookId: selectedBookId.value,
        page: currentPage.value,
        size: pageSize.value,
      };
      const searchResult = await fileApi.searchFiles(searchParams);
      files.value = searchResult.files || [];
      total.value = searchResult.total || 0;
    } else if (fileTypeFilter.value === 'table_folder') {
      // 表格文件夹：通过搜索 fileType="table_folder" 获取所有表格文件夹
      const searchParams: FileSearchParams = {
        keyword: searchKeyword.value.trim() || '', // 必填，空字符串也可以
        fileType: 'table_folder',
        bookId: selectedBookId.value,
        page: currentPage.value,
        size: pageSize.value,
      };
      const searchResult = await fileApi.searchFiles(searchParams);
      files.value = searchResult.files || [];
      total.value = searchResult.total || 0;
    } else if (searchKeyword.value.trim() || fileTypeFilter.value) {
      // 有搜索关键词或文件类型筛选，使用搜索接口
      const searchParams: FileSearchParams = {
        keyword: searchKeyword.value.trim() || '', // 必填，空字符串也可以
        fileType: fileTypeFilter.value || undefined,
        bookId: selectedBookId.value,
        page: currentPage.value,
        size: pageSize.value,
      };
      const searchResult = await fileApi.searchFiles(searchParams);
      files.value = searchResult.files || [];
      total.value = searchResult.total || 0;
    } else {
      // 否则使用按章节查询接口（获取所有文件）
      data = await fileApi.getFilesByProperty(property.value, {
        page: currentPage.value,
        size: pageSize.value,
        bookId: selectedBookId.value,
      });
    
    // 合并文章和图片
    files.value = [...(data.content || []), ...(data.images || [])];
    total.value = data.totalRecords || 0;
    }

    console.log('📋 文件列表加载成功:', {
      文件数量: files.value.length,
      总数: total.value,
      当前页: currentPage.value,
      每页大小: pageSize.value,
      书籍ID: selectedBookId.value,
      文件类型筛选: fileTypeFilter.value,
    });
  } catch (error: any) {
    console.error('❌ 获取文件列表失败:', error);
    ElMessage.error(`获取文件列表失败: ${error.message || '未知错误'}`);
    files.value = [];
    total.value = 0;
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
const handleSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  pageSize.value = parseInt(target.value);
  currentPage.value = 1; // 重置到第一页
  fetchFiles();
};

// 选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedFiles.value = selection;
};

// 批量删除
const batchDelete = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请选择要删除的文件');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    loading.value = true;
    const result = await fileApi.batchDeleteFiles(selectedFiles.value);
    
    ElMessage.success(result.message);
    selectedFiles.value = [];
    await fetchFiles();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error);
      ElMessage.error(`批量删除失败: ${error.message || '未知错误'}`);
    }
  } finally {
    loading.value = false;
  }
};

// 确认删除单个文件
const confirmDelete = (id: number) => {
  fileIdToDelete.value = id;
  deleteDialogVisible.value = true;
};

// 确认删除单个文件
const confirmDeleteAction = async () => {
  if (fileIdToDelete.value === null) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      '确定要删除这个文件吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await deleteFile(fileIdToDelete.value);
    await fetchFiles();
  } catch (error: any) {
    if (error !== 'cancel') {
    console.error('删除文件失败', error);
    }
  } finally {
    deleteDialogVisible.value = false;
    fileIdToDelete.value = null;
  }
};

// 删除文件
const deleteFile = async (fileId: number, showMessage = true) => {
  try {
    await fileApi.deleteFile(fileId);
      if (showMessage) {
        ElMessage.success('文件删除成功');
      }
      return true;
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
  // 同时兼容 Linux/Windows 路径分隔符
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
};

// 生成友好显示名（不暴露后端真实路径）
const getDisplayName = (file: FileItem) => {
  const baseName = getFileName(file.file_path || '');

  // 去掉书籍ID前缀，如 "1_1.1_xxx.pdf" -> "1.1_xxx.pdf"
  const cleaned = baseName.replace(/^\d+_/, '');

  const property = (file.property || '').trim();
  const ext = cleaned.split('.').pop()?.toLowerCase() || '';
  const nameNoExt = cleaned.replace(/\.[^.]+$/, '');

  // 目录类型
  if (file.is_directory || file.file_type === 'img_folder') {
    return property ? `${property} 图片文件夹` : '图片文件夹';
  }
  if (file.file_type === 'table_folder') {
    return property ? `${property} 表格文件夹` : '表格文件夹';
  }

  // 摘要文件（如 4.3_summary.txt 或 4.3/summary.txt）
  if (/(^|[_-])summary\.(txt|md)$/i.test(baseName)) {
    return property ? `${property} 摘要` : '章节摘要';
  }

  // Markdown / PDF 等正文
  if (ext === 'md') {
    if (!property) return nameNoExt;
    // 如果 property 和 nameNoExt 相同，只显示一次
    if (property === nameNoExt) return property;
    // 如果 nameNoExt 以 property 开头，只显示 nameNoExt
    if (nameNoExt.startsWith(property)) return nameNoExt;
    // 否则显示 property + nameNoExt（去掉数字前缀）
    const cleanedName = nameNoExt.replace(/^\d+\.\d+\s*/, '');
    return cleanedName ? `${property} ${cleanedName}` : property;
  }
  if (ext === 'pdf') {
    if (!property) return nameNoExt;
    // 如果 property 和 nameNoExt 相同，只显示一次
    if (property === nameNoExt) return property;
    // 如果 nameNoExt 以 property 开头，只显示 nameNoExt
    if (nameNoExt.startsWith(property)) return nameNoExt;
    // 否则显示 property + nameNoExt（去掉数字前缀）
    const cleanedName = nameNoExt.replace(/^\d+\.\d+\s*/, '');
    return cleanedName ? `${property} ${cleanedName}` : property;
  }
  if (ext === 'txt' && file.file_type === 'text') {
    return property ? `${property} 文本` : nameNoExt;
  }

  // 图片/其它
  if (['jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext)) {
    return property ? `${property} 图片` : cleaned;
  }

  // 兜底：优先用 details，其次 property，最后文件名
  return file.details?.trim() || (property ? property : cleaned);
};

// ===== 文章格式细分（PDF / MD） =====
const getArticleFormat = (file: FileItem): 'PDF' | 'MD' | '' => {
  const ext = (file.file_path || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'md' || ext === 'markdown') return 'MD';
  return '';
};

const getFileTypeTextForItem = (file: FileItem) => {
  if (file.file_type === 'article') {
    const fmt = getArticleFormat(file);
    if (fmt === 'PDF') return '文章(PDF)';
    if (fmt === 'MD') return '文章(MD)';
    return '文章';
  }
  return getFileTypeText(file.file_type);
};

const getFileIconForItem = (file: FileItem) => {
  if (file.file_type === 'article') {
    const fmt = getArticleFormat(file);
    if (fmt === 'PDF') return '📕';
    if (fmt === 'MD') return '📝';
  }
  // 回退使用原有逻辑（基于类型字符串的简易图标）
  return getFileIcon(file.file_type || getFileName(file.file_path || ''));
};

// 获取文件类型文本
const getFileTypeText = (fileType: string) => {
  const type = fileType?.toLowerCase();
  if (!type) return '文件类';
  
  if (type === 'pdf') return 'PDF文档';
  if (type === 'md' || type === 'markdown' || type === 'article') return '文章';
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(type)) return '图片';
  if (type === 'text') return '文本';
  if (type.includes('table') || type.includes('folder')) return '文件夹';
  return type;
};

// 格式化文件大小
const formatFileSize = (file: FileItem): string => {
  // 如果文件是目录，显示为文件夹
  if (file.is_directory) {
    return '文件夹';
  }
  
  // 如果有文件大小信息，格式化显示
  if (file.file_size) {
    const bytes = typeof file.file_size === 'number' ? file.file_size : parseInt(file.file_size);
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  return '--';
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

// 创建书籍
const handleCreateBook = async () => {
  if (!newBookForm.value.name || !newBookForm.value.title) {
    ElMessage.warning('请填写书籍名称和标题');
    return;
  }

  try {
    creatingBook.value = true;
    const newBook = await bookApi.createBook({
      name: newBookForm.value.name,
      title: newBookForm.value.title,
      author: newBookForm.value.author || '未知作者',
      description: newBookForm.value.description || ''
    });

    ElMessage.success('书籍创建成功');
    showCreateBookDialog.value = false;
    
    // 重置表单
    newBookForm.value = {
      name: '',
      title: '',
      author: '',
      description: ''
    };

    // 刷新书籍列表
    await loadBooks();
    
    // 如果上传对话框打开，自动选择新创建的书籍
    if (showUploadDialog.value) {
      uploadForm.value.bookId = newBook.id;
    }
  } catch (error: any) {
    console.error('创建书籍失败:', error);
    ElMessage.error(`创建书籍失败: ${error.message || '未知错误'}`);
  } finally {
    creatingBook.value = false;
  }
};

// 上传对话框打开时，初始化书籍ID
const handleUploadBookChange = () => {
  // 如果选择了书籍，同时更新 selectedBookId
  if (uploadForm.value.bookId) {
    selectedBookId.value = uploadForm.value.bookId;
  }
};

// 上传类型变化时，重置相关字段
const handleUploadTypeChange = () => {
  uploadForm.value.folderName = '';
  uploadForm.value.property = '';
  uploadForm.value.files = [];
  uploadForm.value.imageFiles = [];
  uploadForm.value.tableFiles = [];
  uploadForm.value.summaryFile = [];
};

// 文件选择变化处理
const handleFilesChange = (file: any, fileList: any[]) => {
  uploadForm.value.files = fileList;
};

const handleImageFolderChange = (file: any, fileList: any[]) => {
  uploadForm.value.imageFiles = fileList;
};

const handleTableFolderChange = (file: any, fileList: any[]) => {
  uploadForm.value.tableFiles = fileList;
};

const handleSummaryChange = (file: any, fileList: any[]) => {
  uploadForm.value.summaryFile = fileList;
};

// 检查是否可以提交上传
const canSubmitUpload = computed(() => {
  if (!uploadForm.value.bookId) return false;
  const folderNameTrimmed = (uploadForm.value.folderName || '').trim();
  const propertyTrimmed = (uploadForm.value.property || '').trim();
  
  switch (uploadForm.value.uploadType) {
    case 'files':
      return uploadForm.value.files.length > 0;
    case 'imageFolder':
      return folderNameTrimmed.length > 0 && uploadForm.value.imageFiles.length > 0;
    case 'tableFolder':
      return folderNameTrimmed.length > 0 && uploadForm.value.tableFiles.length > 0;
    case 'summary':
      return propertyTrimmed.length > 0 && uploadForm.value.summaryFile.length > 0;
    default:
      return false;
  }
});

// 取消上传
const handleCancelUpload = () => {
  showUploadDialog.value = false;
  // 重置表单
  uploadForm.value = {
    bookId: selectedBookId.value,
    uploadType: 'files',
    files: [],
    imageFiles: [],
    tableFiles: [],
    summaryFile: [],
    folderName: '',
    property: ''
  };
};

// 提交上传
const handleSubmitUpload = async () => {
  if (!canSubmitUpload.value) {
    ElMessage.warning('请完善上传信息');
    return;
  }

  try {
    uploading.value = true;
    let result: any;
    const folderNameTrimmed = (uploadForm.value.folderName || '').trim();
    const propertyTrimmed = (uploadForm.value.property || '').trim();

    switch (uploadForm.value.uploadType) {
      case 'files': {
        const files = uploadForm.value.files.map((f: any) => f.raw || f);
        result = await fileApi.uploadFiles(files, uploadForm.value.bookId);
        break;
      }
      case 'imageFolder': {
        if (!folderNameTrimmed) {
          throw new Error('文件夹名称不能为空');
        }
        const imageFiles = uploadForm.value.imageFiles.map((f: any) => f.raw || f);
        result = await fileApi.uploadImageFolder(
          folderNameTrimmed,
          imageFiles,
          uploadForm.value.bookId
        );
        break;
      }
      case 'tableFolder': {
        if (!folderNameTrimmed) {
          throw new Error('文件夹名称不能为空');
        }
        const tableFiles = uploadForm.value.tableFiles.map((f: any) => f.raw || f);
        result = await fileApi.uploadTableFolder(
          folderNameTrimmed,
          tableFiles,
          uploadForm.value.bookId
        );
        break;
      }
      case 'summary': {
        if (!propertyTrimmed) {
          throw new Error('章节属性不能为空');
        }
        const summaryFile = uploadForm.value.summaryFile[0];
        const file = summaryFile.raw || summaryFile;
        result = await fileApi.uploadSummary(
          propertyTrimmed,
          file,
          uploadForm.value.bookId
        );
        break;
      }
    }

    if (result?.originalFolderName && result.originalFolderName !== result.folderName) {
      ElMessage.info(
        `文件夹名称已自动规范化：${result.originalFolderName} → ${result.folderName}`
      );
    }

    ElMessage.success('上传成功');
    showUploadDialog.value = false;

    const targetBookId = uploadForm.value.bookId;

    // 重置表单
    handleCancelUpload();
    
    // 刷新文件列表
    if (selectedBookId.value === targetBookId) {
      await fetchFiles();
    } else {
      // 如果上传到了不同的书籍，切换到该书籍
      selectedBookId.value = targetBookId;
      await fetchFiles();
    }
  } catch (error: any) {
    console.error('上传失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '上传失败';
    if (error.message) {
      errorMessage += ': ' + error.message;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = '网络连接失败，请检查：\n1. 后端服务是否运行（http://localhost:8080）\n2. 网络连接是否正常';
    } else {
      errorMessage += ': 未知错误，请查看控制台获取详细信息';
    }
    
    ElMessage.error(errorMessage);
  } finally {
    uploading.value = false;
  }
};

// 新建文件夹（暂时不支持，显示提示）
const handleNewFolder = () => {
  ElMessage.info('新建文件夹功能暂未实现，您可以通过上传文件时指定章节属性来组织文件');
};

// 书籍选择变化
const handleBookChange = () => {
  currentPage.value = 1; // 重置到第一页
  if (selectedBookId.value !== undefined) {
    fetchFiles(); // 只有选择了具体书籍时才获取文件列表
  }
};

// 选择书籍
const selectBook = (bookId: number) => {
  selectedBookId.value = bookId;
  currentPage.value = 1;
  fetchFiles();
};

// 查看书籍文件
const viewBookFiles = (bookId: number) => {
  selectBook(bookId);
};

// 编辑书籍
const editBook = (book: Book) => {
  ElMessage.info(`编辑书籍功能开发中: ${book.title || book.name}`);
};

// 加载书籍列表
const loadBooks = async () => {
  try {
    const response = await bookApi.getAllBooks();
    books.value = response.books || [];
    console.log('📚 书籍列表加载成功:', books.value.length, '本书');
  } catch (error: any) {
    console.error('❌ 加载书籍列表失败:', error);
    // 不显示错误提示，因为这是可选功能
  }
};

// 监听上传对话框打开，初始化书籍ID
watch(showUploadDialog, (isOpen) => {
  if (isOpen) {
    // 如果当前选择了书籍，自动填充
    uploadForm.value.bookId = selectedBookId.value;
  }
});

// 初始化
onMounted(async () => {
  await loadBooks();
  await fetchFiles();
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
  align-items: center;
}

.book-select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 150px;
}

.book-select:hover {
  border-color: #d1d5db;
}

.book-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 书籍列表网格样式 */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}

.book-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.book-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 8px;
}

.book-info {
  flex: 1;
}

.book-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.book-author {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.book-description {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.book-action-btn {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.book-action-btn:hover {
  background: #f9fafb;
  border-color: #667eea;
  transform: scale(1.1);
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