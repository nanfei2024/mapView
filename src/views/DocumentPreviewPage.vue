<template>
  <div class="document-preview-page">
    <!-- 顶部导航栏 -->
    <div class="preview-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="icon">←</span>
          <span>返回</span>
        </button>
        <div class="file-info">
          <h2 class="file-name">{{ fileName }}</h2>
          <span class="file-meta">文档数字化对比预览</span>
        </div>
      </div>
      
      <div class="header-right">
        <button class="action-btn" @click="downloadResult">
          <span class="icon">⬇️</span>
          下载完整结果
        </button>
        <button class="action-btn" @click="toggleLayout">
          <span class="icon">{{ isVertical ? '⬌' : '⬍' }}</span>
          {{ isVertical ? '横向对比' : '纵向对比' }}
        </button>
      </div>
    </div>

    <!-- 对比区域 -->
    <div class="preview-container" :class="{ vertical: isVertical }">
      <!-- 左侧：源文件预览 -->
      <div class="preview-panel left-panel">
        <div class="panel-header">
          <span class="panel-title">📄 源文件</span>
          <span class="panel-subtitle">{{ originalFileUrl ? 'PDF 文档' : '无源文件' }}</span>
        </div>
        
        <div class="panel-content">
          <div v-if="loadingPdf" class="loading-state">
            <div class="spinner"></div>
            <p>正在加载 PDF...</p>
          </div>
          
          <div v-else-if="pdfError" class="error-state">
            <div class="error-icon">⚠️</div>
            <p>{{ pdfError }}</p>
            <p class="error-hint">源文件可能无法在浏览器中直接预览</p>
          </div>
          
          <div v-else-if="originalFileUrl" class="pdf-viewer">
            <!-- PDF 预览方式切换 -->
            <div class="pdf-viewer-controls">
              <button 
                class="viewer-switch-btn"
                :class="{ active: pdfViewerType === 'mozilla' }"
                @click="pdfViewerType = 'mozilla'"
                title="Mozilla PDF.js（推荐）"
              >
                📄 PDF.js
              </button>
              <button 
                class="viewer-switch-btn"
                :class="{ active: pdfViewerType === 'google' }"
                @click="pdfViewerType = 'google'"
                title="Google Docs Viewer"
              >
                🌐 Google
              </button>
              <button 
                class="viewer-switch-btn"
                :class="{ active: pdfViewerType === 'direct' }"
                @click="pdfViewerType = 'direct'"
                title="直接预览"
              >
                🔗 Direct
              </button>
              <button 
                class="viewer-switch-btn download-btn"
                @click="downloadOriginalPdf"
                title="下载 PDF"
              >
                ⬇️ 下载
              </button>
            </div>
            
            <!-- Mozilla PDF.js 查看器 -->
            <iframe 
              v-if="pdfViewerType === 'mozilla'"
              :src="getPdfViewerUrl(originalFileUrl, 'mozilla')" 
              frameborder="0"
              class="pdf-iframe"
              @error="handlePdfViewerError"
            ></iframe>
            
            <!-- Google Docs 查看器 -->
            <iframe 
              v-else-if="pdfViewerType === 'google'"
              :src="getPdfViewerUrl(originalFileUrl, 'google')" 
              frameborder="0"
              class="pdf-iframe"
              @error="handlePdfViewerError"
            ></iframe>
            
            <!-- 直接预览 -->
            <iframe 
              v-else
              :src="getPdfViewerUrl(originalFileUrl, 'direct')"
              @error="handlePdfViewerError" 
              frameborder="0"
              class="pdf-iframe"
            ></iframe>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">📭</div>
            <p>无源文件预览</p>
            <p class="empty-hint">此文件通过本地上传方式解析</p>
            <p class="empty-hint">浏览器安全限制无法显示原始PDF</p>
            <p class="empty-hint">右侧可查看完整解析结果 →</p>
          </div>
        </div>
      </div>

      <!-- 右侧：Markdown 渲染结果 -->
      <div class="preview-panel right-panel">
        <div class="panel-header">
          <span class="panel-title">📝 解析结果</span>
          <div class="panel-actions">
            <button 
              class="view-mode-btn"
              :class="{ active: viewMode === 'rendered' }"
              @click="viewMode = 'rendered'"
            >
              渲染视图
            </button>
            <button 
              class="view-mode-btn"
              :class="{ active: viewMode === 'source' }"
              @click="viewMode = 'source'"
            >
              源码视图
            </button>
          </div>
        </div>
        
        <div class="panel-content">
          <div v-if="loadingMarkdown" class="loading-state">
            <div class="spinner"></div>
            <p>正在加载解析结果...</p>
          </div>
          
          <div v-else-if="markdownError" class="error-state">
            <div class="error-icon">⚠️</div>
            <p>{{ markdownError }}</p>
          </div>
          
          <div v-else-if="viewMode === 'rendered'" class="markdown-rendered" v-html="renderedMarkdown"></div>
          
          <pre v-else class="markdown-source">{{ markdownContent }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import JSZip from 'jszip';
import { marked } from 'marked';

const router = useRouter();
const route = useRoute();

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
});

// 路由参数
const fileName = ref<string>('');
const resultUrl = ref<string>('');
const originalFileUrl = ref<string>('');

// 布局状态
const isVertical = ref(false); // false = 左右布局, true = 上下布局
const viewMode = ref<'rendered' | 'source'>('rendered');

// PDF 状态
const loadingPdf = ref(false);
const pdfError = ref('');
const pdfViewerType = ref<'mozilla' | 'google' | 'direct'>('mozilla'); // 默认使用 Mozilla PDF.js

// Markdown 状态
const loadingMarkdown = ref(false);
const markdownError = ref('');
const markdownContent = ref('');

// 计算属性：渲染 Markdown
const renderedMarkdown = computed(() => {
  if (!markdownContent.value) return '';
  
  try {
    return marked(markdownContent.value);
  } catch (error) {
    console.error('Markdown 渲染失败:', error);
    return '<p>Markdown 渲染失败</p>';
  }
});

// 计算属性：PDF 查看器 URL
const pdfViewerUrl = computed(() => {
  if (!originalFileUrl.value) return '';
  
  // 使用浏览器内置的 PDF 查看器
  return originalFileUrl.value;
});

// 获取 PDF 查看器 URL（处理跨域问题）
const getPdfViewerUrl = (url: string, type: 'mozilla' | 'google' | 'direct'): string => {
  if (!url) return '';
  
  if (type === 'mozilla') {
    // Mozilla PDF.js 查看器（可能遇到跨域问题）
    // 如果遇到跨域问题，会回退到直接预览
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
  } else if (type === 'google') {
    // Google Docs 查看器
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  } else {
    // 直接预览（使用浏览器内置 PDF 查看器）
    return url;
  }
};

// 处理 PDF 查看器错误
const handlePdfViewerError = () => {
  console.warn('PDF 查看器加载失败，可能是跨域问题');
  pdfError.value = 'PDF 预览失败，可能是跨域限制。请尝试切换到"直接预览"或"下载 PDF"。';
  // 自动切换到直接预览
  if (pdfViewerType.value !== 'direct') {
    pdfViewerType.value = 'direct';
  }
};

// 初始化
onMounted(async () => {
  // 从路由参数获取数据
  fileName.value = route.query.fileName as string || '未知文件';
  resultUrl.value = route.query.resultUrl as string || '';
  originalFileUrl.value = route.query.originalUrl as string || '';
  const fileId = route.query.fileId as string || '';
  const markdownFromQuery = route.query.markdownContent as string || '';
  
  console.log('📋 预览页面参数:', {
    fileName: fileName.value,
    resultUrl: resultUrl.value,
    originalFileUrl: originalFileUrl.value,
    fileId: fileId
  });
  
  // 优先使用路由参数中的 Markdown 内容
  if (markdownFromQuery) {
    console.log('✅ 使用路由参数中的 Markdown 内容');
    markdownContent.value = markdownFromQuery;
    loadingMarkdown.value = false;
  } else if (fileId) {
    // 如果有 fileId，从后端 API 获取 Markdown 内容
    console.log('📥 从后端 API 获取 Markdown 内容: fileId=', fileId);
    await loadMarkdownFromBackend(fileId);
  } else if (resultUrl.value) {
    // 否则尝试从 ZIP 文件加载（备用方案）
    console.log('📥 从 ZIP 文件加载 Markdown 内容');
    await loadMarkdownFromZip();
  } else {
    markdownError.value = '缺少解析结果 URL 或 fileId';
  }
  
  // 检查 PDF URL
  if (originalFileUrl.value) {
    loadingPdf.value = false; // PDF 通过 iframe 加载，不需要额外处理
  }
});

// 从后端 API 加载 Markdown 内容（推荐方式）
const loadMarkdownFromBackend = async (fileId: string) => {
  loadingMarkdown.value = true;
  markdownError.value = '';
  
  try {
    console.log('📥 从后端 API 获取 Markdown 内容: fileId=', fileId);
    
    // 使用后端 API 获取 Markdown 内容
    const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const apiUrl = `${backendBaseUrl}/api/mineru/markdown/${fileId}`;
    
    console.log('📤 请求 URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`获取 Markdown 内容失败: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data && result.data.content) {
      markdownContent.value = result.data.content;
      console.log('✅ Markdown 内容获取成功，长度:', markdownContent.value.length);
    } else {
      throw new Error(result.message || 'Markdown 内容为空');
    }
    
    loadingMarkdown.value = false;
    console.log('🎉 Markdown 加载完成');
    
  } catch (error: any) {
    loadingMarkdown.value = false;
    markdownError.value = error.message || '加载失败';
    console.error('❌ Markdown 加载失败:', error);
    
    // 如果后端获取失败，尝试从 ZIP 文件加载（备用方案）
    if (resultUrl.value) {
      console.log('⚠️ 后端获取失败，尝试从 ZIP 文件加载...');
      await loadMarkdownFromZip();
    }
  }
};

// 从 ZIP 文件加载 Markdown 内容（备用方案）
const loadMarkdownFromZip = async () => {
  loadingMarkdown.value = true;
  markdownError.value = '';
  
  try {
    console.log('📥 开始下载 ZIP 文件:', resultUrl.value);
    
    // 直接下载 ZIP 文件（不使用代理）
    const response = await fetch(resultUrl.value);
    
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('✅ ZIP 下载完成:', blob.size, 'bytes');
    
    // 解压 ZIP
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(blob);
    
    // 查找 Markdown 文件
    let found = false;
    for (const [filename, file] of Object.entries(zipContent.files)) {
      if (!file.dir && filename.toLowerCase().endsWith('.md')) {
        console.log('✅ 找到 Markdown:', filename);
        markdownContent.value = await file.async('text');
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error('ZIP 中未找到 Markdown 文件');
    }
    
    loadingMarkdown.value = false;
    console.log('🎉 Markdown 加载完成');
    
  } catch (error: any) {
    loadingMarkdown.value = false;
    markdownError.value = error.message || '加载失败';
    console.error('❌ Markdown 加载失败:', error);
  }
};

// 返回
const goBack = () => {
  router.back();
};

// 下载结果
const downloadResult = () => {
  if (!resultUrl.value) {
    alert('无下载链接');
    return;
  }
  
  window.open(resultUrl.value, '_blank');
};

// 切换布局
const toggleLayout = () => {
  isVertical.value = !isVertical.value;
};

// 下载原始 PDF
const downloadOriginalPdf = () => {
  if (!originalFileUrl.value) {
    alert('源文件 URL 不可用');
    return;
  }
  
  // 创建一个隐藏的 a 标签进行下载
  const a = document.createElement('a');
  a.href = originalFileUrl.value;
  a.download = fileName.value || 'document.pdf';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
</script>

<style scoped>
.document-preview-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

/* ===== 顶部导航栏 ===== */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.back-btn .icon {
  font-size: 18px;
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-btn .icon {
  font-size: 16px;
}

/* ===== 对比容器 ===== */
.preview-container {
  flex: 1;
  display: flex;
  gap: 1px;
  background: #e5e7eb;
  overflow: hidden;
}

.preview-container.vertical {
  flex-direction: column;
}

/* ===== 面板 ===== */
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.panel-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-left: 12px;
}

.panel-actions {
  display: flex;
  gap: 4px;
  background: #e5e7eb;
  padding: 3px;
  border-radius: 6px;
}

.view-mode-btn {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-mode-btn.active {
  background: white;
  color: #2563eb;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.panel-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

/* ===== 加载/错误/空状态 ===== */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 40px;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p,
.error-state p,
.empty-state p {
  font-size: 15px;
  color: #6b7280;
  margin: 8px 0;
}

.error-icon,
.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.error-hint,
.empty-hint {
  font-size: 13px !important;
  color: #9ca3af !important;
}

/* ===== PDF 查看器 ===== */
.pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #525659;
}

.pdf-viewer-controls {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.viewer-switch-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.viewer-switch-btn:hover {
  background: #f0f0f0;
  border-color: #00a3ff;
}

.viewer-switch-btn.active {
  background: #e6f7ff;
  border-color: #00a3ff;
  color: #00a3ff;
  font-weight: 500;
}

.viewer-switch-btn.download-btn {
  margin-left: auto;
  background: #00a3ff;
  color: white;
  border-color: #00a3ff;
}

.viewer-switch-btn.download-btn:hover {
  background: #0090e0;
}

.pdf-iframe {
  width: 100%;
  flex: 1;
  border: none;
  background: #525659;
}

/* ===== Markdown 渲染 ===== */
.markdown-rendered {
  padding: 32px 48px;
  max-width: 900px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  line-height: 1.8;
  color: #1f2937;
}

.markdown-rendered :deep(h1) {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 32px 0 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.markdown-rendered :deep(h2) {
  font-size: 26px;
  font-weight: 600;
  color: #111827;
  margin: 28px 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-rendered :deep(h3) {
  font-size: 22px;
  font-weight: 600;
  color: #374151;
  margin: 24px 0 12px;
}

.markdown-rendered :deep(p) {
  margin: 14px 0;
  line-height: 1.8;
  color: #374151;
}

.markdown-rendered :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.markdown-rendered :deep(ul),
.markdown-rendered :deep(ol) {
  margin: 14px 0;
  padding-left: 32px;
}

.markdown-rendered :deep(li) {
  margin: 8px 0;
  line-height: 1.7;
}

.markdown-rendered :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9em;
  color: #ef4444;
}

.markdown-rendered :deep(pre) {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  overflow-x: auto;
  margin: 20px 0;
}

.markdown-rendered :deep(pre code) {
  background: none;
  padding: 0;
  color: #374151;
  font-size: 14px;
}

.markdown-rendered :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  border: 1px solid #e5e7eb;
}

.markdown-rendered :deep(th) {
  background: #f9fafb;
  padding: 14px;
  text-align: left;
  font-weight: 600;
  border: 1px solid #e5e7eb;
  color: #111827;
}

.markdown-rendered :deep(td) {
  padding: 14px;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.markdown-rendered :deep(tr:hover) {
  background: #f9fafb;
}

.markdown-rendered :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 20px;
  margin: 20px 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-rendered :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 20px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* ===== Markdown 源码 ===== */
.markdown-source {
  padding: 32px 48px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #f9fafb;
  margin: 0;
}

/* ===== 滚动条样式 ===== */
.panel-content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 5px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .preview-container {
    flex-direction: column;
  }
  
  .file-name {
    max-width: 300px;
  }
  
  .markdown-rendered {
    padding: 24px 20px;
  }
}
</style>


