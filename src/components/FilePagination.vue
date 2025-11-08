<template>
  <div class="file-management">
    <!-- 搜索和操作区域 -->
    <div class="search-bar">
      <el-form :inline="true" class="search-form">
        <el-form-item label="章节号">
          <el-input 
            v-model="property" 
            placeholder="请输入章节号" 
            clearable 
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="fileTypeFilter" placeholder="选择文件类型" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="PDF" value="pdf"></el-option>
            <el-option label="Markdown" value="md"></el-option>
            <el-option label="图片" value="image"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <div class="action-bar">
        <el-button type="success" @click="refreshList">
          <el-icon><i-ep-refresh /></el-icon> 刷新
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedFiles.length === 0"
          @click="batchDelete"
        >
          <el-icon><i-ep-delete /></el-icon> 批量删除
        </el-button>
      </div>
    </div>
    
    <!-- 文件表格 -->
    <el-table 
      :data="files" 
      border 
      style="width: 100%;" 
      size="small"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="property" label="章节" min-width="80" sortable></el-table-column>
      <el-table-column prop="file_type" label="文件类型" min-width="80" sortable>
        <template #default="scope">
          <el-tag 
            :type="getFileTypeTag(scope.row.file_type)" 
            size="small"
          >
            {{ scope.row.file_type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="file_path" label="文件路径" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="upload_time" label="上传时间" min-width="150" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.upload_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <div class="action-buttons">
            <el-button size="small" @click="showDetails(scope.row.id)">
              <el-icon><i-ep-view /></el-icon>
            </el-button>
            <el-button size="small" type="primary" @click="editFile(scope.row)">
              <el-icon><i-ep-edit /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="confirmDelete(scope.row.id)"
            >
              <el-icon><i-ep-delete /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页控件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="fetchFiles"
      >
      </el-pagination>
    </div>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
    >
      <span>确定要删除选中的文件吗？此操作不可恢复。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteAction">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

// 路由
const router = useRouter();

// 状态变量
const files = ref<any[]>([]); 
const property = ref('');
const fileTypeFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const selectedFiles = ref<any[]>([]);
const deleteDialogVisible = ref(false);
const fileIdToDelete = ref<number | null>(null);

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

/* 响应式调整 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-form {
    width: 100%;
  }
  
  .action-bar {
    width: 100%;
    justify-content: flex-end;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 10px;
  }
}
</style>