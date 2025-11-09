<template>
  <div class="file-list-page">
    <!-- 顶部导航栏 -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button class="back-btn" @click="goBack">
            <span class="back-icon">←</span>
            <span>返回</span>
          </button>
          <div class="page-title-section">
            <h1 class="main-title">文件管理中心</h1>
            <p class="subtitle">管理和查看您的所有文件资源</p>
          </div>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="user-avatar">👤</span>
            <span class="user-name">管理员</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 标签页切换 -->
    <div class="tabs-container">
      <div class="tabs-wrapper">
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'files' }"
          @click="activeTab = 'files'"
        >
          <span class="tab-icon">📋</span>
          <span class="tab-text">文件列表</span>
        </button>
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'images' }"
          @click="activeTab = 'images'"
        >
          <span class="tab-icon">🖼️</span>
          <span class="tab-text">我的图库</span>
        </button>
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'tables' }"
          @click="activeTab = 'tables'"
        >
          <span class="tab-icon">📊</span>
          <span class="tab-text">我的表库</span>
        </button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <main class="page-content">
      <!-- 文件列表 -->
      <div v-if="activeTab === 'files'" class="tab-content">
        <FilePagination />
      </div>

      <!-- 我的图库 -->
      <div v-if="activeTab === 'images'" class="tab-content">
        <ImageGallery />
      </div>

      <!-- 我的表库 -->
      <div v-if="activeTab === 'tables'" class="tab-content">
        <TableLibrary />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import FilePagination from '../components/FilePagination.vue';
import ImageGallery from '../components/ImageGallery.vue';
import TableLibrary from '../components/TableLibrary.vue';

const router = useRouter();

// 当前激活的标签页
const activeTab = ref<'files' | 'images' | 'tables'>('files');

// 返回上一页
const goBack = () => {
  router.back();
};
</script>

<style scoped>
/* ===== 页面容器 ===== */
.file-list-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* ===== 顶部导航栏 ===== */
.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #f9fafb;
  border-color: #667eea;
  color: #667eea;
  transform: translateX(-4px);
}

.back-icon {
  font-size: 20px;
  font-weight: bold;
}

.page-title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-avatar {
  font-size: 20px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-weight: 600;
}

/* ===== 标签页切换 ===== */
.tabs-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  position: sticky;
  top: 86px;
  z-index: 999;
}

.tabs-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: none;
  background: transparent;
  border-bottom: 3px solid transparent;
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.tab-icon {
  font-size: 20px;
}

.tab-text {
  font-weight: 600;
}

/* ===== 主内容区域 ===== */
.page-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 0 32px 32px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

/* ===== 响应式设计 ===== */
@media (max-width: 1024px) {
  .header-content {
    padding: 16px 24px;
  }
  
  .page-content {
    padding: 24px;
  }
  
  .main-title {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-right {
    justify-content: flex-end;
  }
  
  .page-content {
    padding: 16px;
  }
  
  .main-title {
    font-size: 20px;
  }
  
  .subtitle {
    font-size: 13px;
  }
  
  .back-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}

/* ===== 动画效果 ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-list-page {
  animation: fadeIn 0.5s ease;
}

/* ===== 加载动画 ===== */
.page-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent 0%,
    #667eea 50%,
    transparent 100%
  );
  animation: loading 2s ease-in-out infinite;
  opacity: 0;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
    opacity: 0.5;
  }
  100% {
    transform: translateX(100%);
    opacity: 0.5;
  }
}

/* ===== 滚动条美化 ===== */
.file-list-page :deep(::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

.file-list-page :deep(::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.file-list-page :deep(::-webkit-scrollbar-thumb) {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 4px;
}

.file-list-page :deep(::-webkit-scrollbar-thumb):hover {
  background: rgba(102, 126, 234, 0.7);
}
</style>

