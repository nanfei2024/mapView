<template>
  <div class="document-digitalization-page">
    <!-- 顶部导航栏 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="back-btn" @click="goBack">
            <span class="back-icon">←</span>
          </div>
          <h1 class="page-title">
            <span class="title-icon">🌍</span>
            <span class="title-text">地质文档数字化</span>
          </h1>
        </div>
        <div class="header-subtitle">智能识别地质报告 · 精准提取专业数据 · 高效构建知识图谱</div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="page-content">
      <div class="content-container">
        <!-- 功能描述 -->
        <section class="feature-section">
          <div class="feature-text">
            <p class="feature-description">
              支持地质报告、地质书籍等多种文档格式的智能解析，通过先进的OCR技术，
              准确识别文档内容，实现高效的文档数字化处理。
            </p>
          </div>
          <div class="feature-notice">
            <div class="notice-icon">💡</div>
            <div class="notice-content">
              <strong>使用说明：</strong>
              <p><strong>本地上传</strong>：文件上传到后端，由后端处理整个流程，避免浏览器安全限制。</p>
              <p><strong>URL上传</strong>：适用于已有公开访问URL的文件，直接传入URL进行解析。</p>
            </div>
          </div>
        </section>

        <!-- 上传区域 -->
        <section class="upload-section">
          <!-- 上传方式选择 -->
          <div class="upload-tabs">
            <div 
              class="tab-item" 
              :class="{ active: uploadMode === 'file' }"
              @click="uploadMode = 'file'"
            >
              <span class="tab-icon">📄</span>
              <span class="tab-text">本地上传</span>
            </div>
            <div 
              class="tab-item" 
              :class="{ active: uploadMode === 'url' }"
              @click="uploadMode = 'url'"
            >
              <span class="tab-icon">🔗</span>
              <span class="tab-text">URL上传</span>
            </div>
          </div>

          <!-- 文件上传区域 -->
          <div v-show="uploadMode === 'file'" class="upload-area-wrapper">
            <div 
              class="upload-area" 
              :class="{ 'drag-over': isDragging }"
              @drop.prevent="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
            >
              <div class="upload-icon-wrapper">
                <div class="upload-icon">📁</div>
              </div>
              <div class="upload-text">
                <p class="upload-primary-text">点击或拖拽文件到此区域上传</p>
                <p class="upload-secondary-text">
                  支持格式：PDF、DOC、DOCX、TXT、PNG、JPG 等
                </p>
              </div>
              <input 
                type="file" 
                ref="fileInput"
                @change="handleFileSelect"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                class="file-input"
              />
              <button class="upload-btn" @click="triggerFileInput">
                选择文件
              </button>
            </div>

            <!-- 文件类型选择 -->
            <div class="file-type-selector">
              <label class="selector-label">文档类型：</label>
              <div class="radio-group">
                <label class="radio-item">
                  <input type="radio" v-model="fileType" value="geology_report" />
                  <span class="radio-text">地质报告</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="fileType" value="geology_book" />
                  <span class="radio-text">地质书籍</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="fileType" value="other" />
                  <span class="radio-text">其他文档</span>
                </label>
              </div>
            </div>
          </div>

          <!-- URL上传区域 -->
          <div v-show="uploadMode === 'url'" class="url-upload-area">
            <div class="url-input-wrapper">
              <input 
                type="text" 
                v-model="urlInput"
                placeholder="请输入文档的URL地址"
                class="url-input"
              />
              <button class="url-submit-btn" @click="handleUrlUpload">
                提交
              </button>
            </div>
            <p class="url-hint">
              支持在线文档链接，系统将自动下载并解析文档内容
            </p>
          </div>
        </section>

        <!-- 已上传文件列表 -->
        <section v-if="uploadedFiles.length > 0" class="file-list-section">
          <div class="section-header">
            <h3 class="section-title">待处理文件</h3>
            <button class="clear-all-btn" @click="clearAllFiles">
              清空列表
            </button>
          </div>
          
          <div class="file-list">
            <div 
              v-for="(file, index) in uploadedFiles" 
              :key="index"
              class="file-item"
            >
              <div class="file-icon">
                <span>{{ getFileIcon(file.name) }}</span>
              </div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-status" :class="file.status">
                  {{ getStatusText(file.status) }}
                </span>
                <span v-if="file.progress" class="file-progress">
                  {{ file.progress.extractedPages }}/{{ file.progress.totalPages }} 页
                </span>
                <span v-if="file.errorMessage" class="file-error" :title="file.errorMessage">
                  {{ file.errorMessage }}
                </span>
              </div>
              </div>
              <div class="file-actions">
                <button 
                  v-if="file.status === 'pending'"
                  class="action-btn process-btn" 
                  @click="processFile(file, index)"
                >
                  开始解析
                </button>
                <button 
                  v-if="file.status === 'uploading'"
                  class="action-btn processing-btn"
                  disabled
                >
                  <span class="spinner-small"></span>
                  上传中...
                </button>
                <button 
                  v-if="file.status === 'processing'"
                  class="action-btn processing-btn"
                  disabled
                >
                  <span class="spinner-small"></span>
                  解析中...
                </button>
                <button 
                  v-if="file.status === 'completed'"
                  class="action-btn preview-btn"
                  @click="previewResult(file)"
                >
                  预览结果
                </button>
                <button 
                  v-if="file.status === 'completed'"
                  class="action-btn download-btn"
                  @click="downloadResult(file)"
                >
                  下载ZIP
                </button>
                <button 
                  v-if="file.status !== 'uploading' && file.status !== 'processing'"
                  class="action-btn delete-btn" 
                  @click="removeFile(index)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>

          <!-- 批量操作按钮 -->
          <div class="batch-actions">
            <button 
              class="batch-btn process-all-btn"
              @click="processAllFiles"
              :disabled="!hasPendingFiles"
            >
              批量解析
            </button>
          </div>
        </section>

        <!-- 示例模板区域 -->
        <section class="template-section">
          <h3 class="section-title">示例模板</h3>
          <div class="template-grid">
            <div 
              v-for="(template, index) in templates" 
              :key="index"
              class="template-card"
              @click="selectTemplate(template)"
            >
              <div class="template-preview">
                <img :src="template.image" :alt="template.name" />
              </div>
              <div class="template-info">
                <h4 class="template-name">{{ template.name }}</h4>
                <p class="template-desc">{{ template.description }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  createExtractTask,
  uploadFile,
  parseDocument,
  getMarkdownContent,
  pollTaskUntilComplete,
  getErrorMessage,
  type TaskResult
} from '../api/mineruApi';

const router = useRouter();

// 上传模式：file (本地上传) 或 url (URL上传)
const uploadMode = ref<'file' | 'url'>('file');

// 文件类型
const fileType = ref('geology_report');

// URL输入
const urlInput = ref('');

// 拖拽状态
const isDragging = ref(false);

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null);

// 已上传文件列表
interface UploadedFile {
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  file?: File;
  type?: string;
  fileId?: string; // 后端返回的文件ID
  taskId?: string;
  resultUrl?: string;
  sourceUrl?: string; // 源文件URL（仅URL上传有效）
  errorMessage?: string;
  markdownContent?: string; // Markdown内容
  progress?: {
    extractedPages: number;
    totalPages: number;
  };
}

const uploadedFiles = ref<UploadedFile[]>([]);
const batchId = ref<string>('');

// 预览相关状态已删除（改为独立页面）

// 示例模板
const templates = [
  {
    name: '亚洲地貌圈及其板块造貌构造纲要',
    description: '地质构造图、地貌数据提取',
    image: '/images/亚洲地貌圈及其板块造貌构造纲要.jpg'
  },
  {
    name: '地学新两论：板块造貌构造学',
    description: '地质理论、学术论文解析',
    image: '/images/地学新两论 上篇 板块造貌构造学-兼论板块学说新发展.jpg'
  },
  {
    name: '板块构造与地貌形迹（上）',
    description: '构造地质学、专业书籍提取',
    image: '/images/板块构造与地貌形迹.jpg'
  },
  {
    name: '板块构造与地貌形迹（下）',
    description: '地质报告、图表数据识别',
    image: '/images/板块构造与地貌形迹下.jpg'
  }
];

// 计算属性：是否有待处理文件
const hasPendingFiles = computed(() => {
  return uploadedFiles.value.some(file => file.status === 'pending');
});

// 预览功能已改为独立页面，不再需要 renderedMarkdown computed

// 返回上一页
const goBack = () => {
  router.back();
};

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(Array.from(target.files));
  }
};

// 处理拖拽上传
const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
};

// 添加文件到列表
const addFiles = (files: File[]) => {
  files.forEach(file => {
    uploadedFiles.value.push({
      name: file.name,
      size: file.size,
      status: 'pending',
      file: file,
      type: fileType.value
    });
  });
};

// 将 GitHub blob URL 转换为 Raw URL
const convertGitHubUrlToRaw = (url: string): string => {
  // GitHub blob URL 格式: https://github.com/{owner}/{repo}/blob/{branch}/{path}
  // GitHub Raw URL 格式: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
  const githubBlobPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)$/;
  const match = url.match(githubBlobPattern);
  
  if (match) {
    const [, owner, repo, path] = match;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${path}`;
    console.log('🔄 GitHub URL 转换:', url, '→', rawUrl);
    return rawUrl;
  }
  
  return url; // 如果不是 GitHub blob URL，直接返回原 URL
};

// 处理URL上传
const handleUrlUpload = async () => {
  if (!urlInput.value.trim()) {
    alert('请输入有效的URL地址');
    return;
  }
  
  let url = urlInput.value.trim();
  
  // URL 基本验证
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    alert('⚠️ URL 格式错误\n\nURL 必须以 http:// 或 https:// 开头\n\n例如：https://example.com/file.pdf');
    return;
  }
  
  // 如果是 GitHub blob URL，转换为 Raw URL
  url = convertGitHubUrlToRaw(url);
  
  const fileName = url.split('/').pop()?.split('?')[0] || 'document';
  
  // 添加到文件列表
  const fileIndex = uploadedFiles.value.length;
  uploadedFiles.value.push({
    name: fileName,
    size: 0,
    status: 'pending',
    type: fileType.value,
    sourceUrl: url // 保存源文件URL
  });
  
  urlInput.value = '';
  
  // 自动开始处理
  try {
    uploadedFiles.value[fileIndex].status = 'processing';
    
    console.log('📤 开始处理 URL:', url);
    console.log('📋 文件名:', fileName);
    console.log('🏷️ 文档类型:', fileType.value);
    
    // 创建解析任务
    const requestData = {
      url: url,
      model_version: 'vlm' as const,
      enable_formula: true,
      enable_table: true,
      language: 'ch',
      data_id: `geo_doc_${Date.now()}`
    };
    
    console.log('📦 请求参数:', requestData);
    
    const response = await createExtractTask(requestData);
    
    console.log('📨 API 响应:', response);
    
    if (response.code !== 0) {
      const errorMsg = response.msg || getErrorMessage(response.code);
      console.error('❌ API 返回错误:', {
        code: response.code,
        message: errorMsg,
        trace_id: response.trace_id
      });
      throw new Error(errorMsg);
    }
    
    const taskId = response.data.task_id;
    uploadedFiles.value[fileIndex].taskId = taskId;
    
    // 开始轮询任务状态
    const result = await pollTaskUntilComplete(taskId, (progress) => {
      if (progress.extract_progress) {
        uploadedFiles.value[fileIndex].progress = {
          extractedPages: progress.extract_progress.extracted_pages,
          totalPages: progress.extract_progress.total_pages
        };
      }
    });
    
    if (result.data.state === 'done') {
      uploadedFiles.value[fileIndex].status = 'completed';
      uploadedFiles.value[fileIndex].resultUrl = result.data.full_zip_url;
    } else {
      throw new Error(result.data.err_msg || '解析失败');
    }
    
  } catch (error: any) {
    uploadedFiles.value[fileIndex].status = 'error';
    uploadedFiles.value[fileIndex].errorMessage = error.message || '处理失败';
    console.error('❌ URL上传处理失败:', error);
    
    let errorMessage = '处理失败: ' + (error.message || '未知错误');
    
    // 根据错误类型提供更详细的提示
    if (error.message.includes('请求参数错误') || error.message.includes('-10002')) {
      errorMessage = 
        '❌ URL 处理失败：请求参数错误\n\n' +
        '可能的原因：\n' +
        '1. URL 格式不正确\n' +
        '2. URL 无法访问（需要公开可访问）\n' +
        '3. 文件格式不支持\n\n' +
        '请确保：\n' +
        '✅ URL 以 https:// 开头\n' +
        '✅ URL 可以在浏览器中直接打开或下载\n' +
        '✅ 文件格式为 PDF、DOC、DOCX、PPT、PPTX、PNG、JPG\n\n' +
        '请检查浏览器控制台(F12)查看详细日志';
    }
    
    alert(errorMessage);
  }
};

// 处理单个文件（按照流程图三个阶段）
const processFile = async (file: UploadedFile, index: number) => {
  if (!file.file) {
    alert('文件不存在');
    return;
  }
  
  try {
    // 阶段一：上传文件到后端
    uploadedFiles.value[index].status = 'uploading';
    console.log('📤 阶段一：上传文件到后端:', file.name);
    
    const uploadResponse = await uploadFile(file.file);
    if (!uploadResponse.success) {
      throw new Error(uploadResponse.message || '文件上传失败');
    }
    
    const fileId = uploadResponse.data.fileId;
    uploadedFiles.value[index].fileId = fileId;
    console.log('✅ 文件上传成功，fileId:', fileId);
    
    // 阶段二：触发解析
    uploadedFiles.value[index].status = 'processing';
    console.log('🔄 阶段二：触发解析，fileId:', fileId);
    
    const parseResponse = await parseDocument(fileId, {
      model_version: 'vlm',
      enable_formula: true,
      enable_table: true,
      language: 'ch'
    });
    
    if (!parseResponse.success) {
      throw new Error(parseResponse.message || '解析失败');
    }
    
    console.log('✅ 解析完成:', parseResponse.data);
    
    // 阶段三：获取Markdown内容
    console.log('📄 阶段三：获取Markdown内容');
    const markdownResponse = await getMarkdownContent(fileId);
    if (markdownResponse.success && markdownResponse.data.content) {
      uploadedFiles.value[index].markdownContent = markdownResponse.data.content;
      uploadedFiles.value[index].status = 'completed';
      uploadedFiles.value[index].resultUrl = parseResponse.data.full_zip_url;
      console.log('✅ Markdown内容获取成功');
    } else {
      throw new Error('获取Markdown内容失败');
    }
    
  } catch (error: any) {
    uploadedFiles.value[index].status = 'error';
      uploadedFiles.value[index].errorMessage = error.message || '处理失败';
    console.error('文件处理失败:', error);
      alert('处理失败: ' + (error.message || '未知错误'));
  }
};

// 批量处理所有待处理文件（按照流程图三个阶段）
const processAllFiles = async () => {
  const pendingFiles = uploadedFiles.value
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => file.status === 'pending' && file.file);
  
  if (pendingFiles.length === 0) {
    alert('没有待处理的本地文件');
    return;
  }
  
  try {
    console.log(`📤 开始批量处理 ${pendingFiles.length} 个文件`);
    
    // 逐个处理文件（按照流程图三个阶段）
    for (let i = 0; i < pendingFiles.length; i++) {
      const { file, index } = pendingFiles[i];
      
      try {
        // 阶段一：上传文件到后端
      uploadedFiles.value[index].status = 'uploading';
        console.log(`📤 [${i + 1}/${pendingFiles.length}] 阶段一：上传文件: ${file.name}`);
        
        const uploadResponse = await uploadFile(file.file!);
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || '文件上传失败');
        }
        
        const fileId = uploadResponse.data.fileId;
        uploadedFiles.value[index].fileId = fileId;
        console.log(`✅ [${i + 1}/${pendingFiles.length}] 文件上传成功，fileId: ${fileId}`);
        
        // 阶段二：触发解析（异步处理，不阻塞其他文件）
      uploadedFiles.value[index].status = 'processing';
        console.log(`🔄 [${i + 1}/${pendingFiles.length}] 阶段二：触发解析，fileId: ${fileId}`);
        
        parseDocument(fileId, {
          model_version: 'vlm',
          enable_formula: true,
          enable_table: true,
          language: 'ch'
        }).then(async (parseResponse) => {
          if (!parseResponse.success) {
            throw new Error(parseResponse.message || '解析失败');
          }
          
          console.log(`✅ [${i + 1}/${pendingFiles.length}] 解析完成`);
          
          // 阶段三：获取Markdown内容
          console.log(`📄 [${i + 1}/${pendingFiles.length}] 阶段三：获取Markdown内容`);
          const markdownResponse = await getMarkdownContent(fileId);
          if (markdownResponse.success && markdownResponse.data.content) {
            uploadedFiles.value[index].markdownContent = markdownResponse.data.content;
            uploadedFiles.value[index].status = 'completed';
            uploadedFiles.value[index].resultUrl = parseResponse.data.full_zip_url;
            console.log(`✅ [${i + 1}/${pendingFiles.length}] Markdown内容获取成功`);
          } else {
            throw new Error('获取Markdown内容失败');
          }
        }).catch(err => {
          uploadedFiles.value[index].status = 'error';
          uploadedFiles.value[index].errorMessage = err.message || '处理失败';
          console.error(`❌ [${i + 1}/${pendingFiles.length}] 处理失败:`, err);
    });
    
        // 稍微延迟，避免并发请求过多
        if (i < pendingFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (err: any) {
        uploadedFiles.value[index].status = 'error';
        uploadedFiles.value[index].errorMessage = err.message || '处理失败';
        console.error(`❌ [${i + 1}/${pendingFiles.length}] 文件处理失败:`, err);
      }
    }
    
    alert(`✅ 批量上传完成！\n\n已提交 ${pendingFiles.length} 个文件，请等待处理完成。`);
    
  } catch (error: any) {
    console.error('批量处理失败:', error);
      alert('批量处理失败: ' + (error.message || '未知错误'));
  }
};

// 移除文件
const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1);
};

// 清空所有文件
const clearAllFiles = () => {
  uploadedFiles.value = [];
};

// 预览结果 - 跳转到对比预览页面
const previewResult = (file: UploadedFile) => {
  if (!file.resultUrl && !file.markdownContent) {
    alert('结果文件不可用');
    return;
  }
  
  console.log('📋 跳转到预览页面:', file.name);
  console.log('📄 源文件URL:', file.sourceUrl || '无（本地上传）');
  console.log('📄 Markdown内容:', file.markdownContent ? '已获取' : '未获取');
  
  // 跳转到对比预览页面，传递参数
  const query: any = {
      fileName: file.name,
    resultUrl: file.resultUrl || '',
    originalUrl: file.sourceUrl || '', // 传递该文件的源URL（仅URL上传有效）
    fileId: file.fileId || '' // 传递 fileId，用于从后端获取 Markdown
  };
  
  // 如果有Markdown内容，也传递过去（如果内容不大）
  if (file.markdownContent) {
    // 如果 Markdown 内容太大（> 100KB），不通过 URL 传递，而是通过后端 API 获取
    if (file.markdownContent.length < 100000) {
      query.markdownContent = file.markdownContent;
    } else {
      console.log('⚠️ Markdown 内容太大，将通过后端 API 获取');
    }
  }
  
  router.push({
    path: '/document-preview',
    query
  });
};

// 下载结果
const downloadResult = (file: UploadedFile) => {
  if (!file.resultUrl) {
    alert('结果文件不可用');
    return;
  }
  
  // 下载结果ZIP文件
  const link = document.createElement('a');
  link.href = file.resultUrl;
  link.download = `${file.name}_result.zip`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 弹窗相关函数已删除（closePreview, downloadFromPreview）
// 预览功能已改为跳转到独立页面

// 选择模板
const selectTemplate = (template: any) => {
  console.log('选择模板:', template);
  // 这里添加选择模板的逻辑
};

// 获取文件图标
const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap: { [key: string]: string } = {
    'pdf': '📕',
    'doc': '📘',
    'docx': '📘',
    'txt': '📄',
    'png': '🖼️',
    'jpg': '🖼️',
    'jpeg': '🖼️'
  };
  return iconMap[ext || ''] || '📄';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '未知大小';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': '待处理',
    'uploading': '上传中',
    'processing': '解析中',
    'completed': '已完成',
    'error': '失败'
  };
  return statusMap[status] || status;
};
</script>

<style scoped>
.document-digitalization-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8edf2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航栏 */
.page-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 40px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

.back-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.back-icon {
  font-size: 20px;
  color: #4b5563;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}

.title-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  animation: rotate-slow 20s linear infinite;
}

@keyframes rotate-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.title-text {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  position: relative;
}

.title-text::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #06b6d4 100%);
  border-radius: 2px;
  opacity: 0.3;
}

.header-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-left: 56px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 主内容区域 */
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 功能描述 */
.feature-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.feature-description {
  font-size: 15px;
  line-height: 1.8;
  color: #4b5563;
  margin: 0 0 16px 0;
}

.feature-notice {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  margin-top: 16px;
}

.notice-icon {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-content strong {
  font-size: 15px;
  color: #1f2937;
  display: block;
  margin-bottom: 8px;
}

.notice-content p {
  font-size: 14px;
  color: #4b5563;
  margin: 4px 0;
  line-height: 1.6;
}

/* 上传区域 */
.upload-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.upload-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s ease;
  color: #6b7280;
  font-weight: 500;
  position: relative;
}

.tab-item:hover {
  background: #f9fafb;
  color: #374151;
}

.tab-item.active {
  color: #3b82f6;
  background: #eff6ff;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
}

.tab-icon {
  font-size: 18px;
}

.tab-text {
  font-size: 15px;
}

/* 文件上传区域 */
.upload-area-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 48px 32px;
  text-align: center;
  transition: all 0.3s ease;
  background: #f9fafb;
  position: relative;
}

.upload-area.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-icon-wrapper {
  margin-bottom: 20px;
}

.upload-icon {
  font-size: 64px;
  opacity: 0.6;
}

.upload-text {
  margin-bottom: 24px;
}

.upload-primary-text {
  font-size: 16px;
  color: #374151;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.upload-secondary-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.file-input {
  display: none;
}

.upload-btn {
  padding: 12px 32px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.upload-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.upload-btn:active {
  transform: translateY(0);
}

/* 文件类型选择 */
.file-type-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.selector-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.radio-group {
  display: flex;
  gap: 24px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-item input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.radio-text {
  font-size: 14px;
  color: #4b5563;
}

/* URL上传区域 */
.url-upload-area {
  padding: 24px;
}

.url-input-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.url-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s ease;
}

.url-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.url-submit-btn {
  padding: 12px 32px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.url-submit-btn:hover {
  background: #2563eb;
}

.url-hint {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

/* 文件列表区域 */
.file-list-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.clear-all-btn {
  padding: 8px 16px;
  background: #f9fafb;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: #f3f4f6;
}

.file-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.file-size {
  color: #9ca3af;
}

.file-status {
  font-weight: 500;
}

.file-status.pending {
  color: #9ca3af;
}

.file-status.uploading {
  color: #8b5cf6;
}

.file-status.processing {
  color: #3b82f6;
}

.file-status.completed {
  color: #10b981;
}

.file-status.error {
  color: #ef4444;
}

.file-progress {
  color: #3b82f6;
  font-size: 12px;
  font-weight: 500;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.file-error {
  color: #ef4444;
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-weight: 500;
}

.process-btn {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.process-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.processing-btn {
  background: #eff6ff;
  color: #3b82f6;
  border-color: #3b82f6;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-btn {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.preview-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.download-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.download-btn:hover {
  background: #059669;
  border-color: #059669;
}

.delete-btn {
  background: white;
  color: #6b7280;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #ef4444;
}

.spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 批量操作 */
.batch-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.batch-btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.process-all-btn {
  background: #3b82f6;
  color: white;
}

.process-all-btn:hover:not(:disabled) {
  background: #2563eb;
}

.process-all-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* 示例模板区域 */
.template-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.template-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.template-preview {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #e5e7eb;
}

.template-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-info {
  padding: 16px;
}

.template-name {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.template-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

/* 预览对话框样式 */
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
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.preview-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 2px solid #e5e7eb;
}

.preview-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-filename {
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
}

.preview-close {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-close:hover {
  background: #ef4444;
  color: white;
}

.preview-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 32px 0;
  border-bottom: 1px solid #e5e7eb;
}

.preview-tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  position: relative;
  bottom: -1px;
}

.preview-tab:hover {
  color: #3b82f6;
}

.preview-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  min-height: 300px;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.preview-loading p {
  margin: 0;
  font-size: 14px;
}

.preview-error {
  text-align: center;
  padding: 60px 20px;
  color: #ef4444;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.preview-error p {
  margin: 0;
  font-size: 14px;
}

.preview-markdown {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
}

.markdown-hint {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-size: 14px;
  color: #1f2937;
}

.markdown-rendered {
  background: white;
  padding: 32px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  max-height: 500px;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  line-height: 1.8;
  color: #1f2937;
}

/* Markdown 渲染样式 */
.markdown-rendered :deep(h1) {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 24px 0 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.markdown-rendered :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 20px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-rendered :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 16px 0 10px;
}

.markdown-rendered :deep(h4) {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 14px 0 8px;
}

.markdown-rendered :deep(p) {
  margin: 12px 0;
  line-height: 1.8;
  color: #374151;
}

.markdown-rendered :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.markdown-rendered :deep(em) {
  font-style: italic;
  color: #6b7280;
}

.markdown-rendered :deep(ul),
.markdown-rendered :deep(ol) {
  margin: 12px 0;
  padding-left: 28px;
}

.markdown-rendered :deep(li) {
  margin: 6px 0;
  line-height: 1.6;
}

.markdown-rendered :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: #ef4444;
}

.markdown-rendered :deep(pre) {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-rendered :deep(pre code) {
  background: none;
  padding: 0;
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
}

.markdown-rendered :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 16px;
  margin: 16px 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-rendered :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border: 1px solid #e5e7eb;
}

.markdown-rendered :deep(th) {
  background: #f9fafb;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border: 1px solid #e5e7eb;
  color: #111827;
}

.markdown-rendered :deep(td) {
  padding: 12px;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.markdown-rendered :deep(tr:hover) {
  background: #f9fafb;
}

.markdown-rendered :deep(a) {
  color: #3b82f6;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.markdown-rendered :deep(a:hover) {
  border-bottom-color: #3b82f6;
}

.markdown-rendered :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-rendered :deep(hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 24px 0;
}

.preview-info {
  padding: 12px 0;
}

.info-item {
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  display: block;
  margin-bottom: 8px;
}

.info-value {
  color: #6b7280;
  font-size: 14px;
}

.info-link {
  color: #3b82f6;
  text-decoration: none;
  word-break: break-all;
  font-size: 13px;
}

.info-link:hover {
  text-decoration: underline;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
}

.info-list li {
  padding: 8px 0;
  color: #6b7280;
  font-size: 14px;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.preview-action-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.preview-action-btn.download {
  background: #3b82f6;
  color: white;
}

.preview-action-btn.download:hover {
  background: #2563eb;
}

.preview-action-btn.close {
  background: #e5e7eb;
  color: #6b7280;
}

.preview-action-btn.close:hover {
  background: #d1d5db;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-content {
    padding: 20px;
  }

  .header-content {
    padding: 16px 20px;
  }

  .page-title {
    font-size: 22px;
  }

  .upload-section,
  .file-list-section,
  .template-section {
    padding: 20px;
  }

  .file-item {
    flex-wrap: wrap;
  }

  .file-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .template-grid {
    grid-template-columns: 1fr;
  }

  .radio-group {
    flex-direction: column;
    gap: 12px;
  }

  .preview-container {
    width: 95%;
    max-height: 90vh;
  }

  .preview-header,
  .preview-tabs,
  .preview-content,
  .preview-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .preview-title {
    font-size: 18px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>

