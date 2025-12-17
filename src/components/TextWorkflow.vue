<template>
  <div class="apple-workflow-container">
    <!-- 动态极光背景 -->
    <div class="aurora-bg"></div>
    
    <div class="content-wrapper">
      <!-- 标题区域 -->
      <header class="header-section">
        <h1 class="main-title">文本数据治理流水线</h1>
        <p class="subtitle">全链路数字化 · 智能化重构 · 精细化治理</p>
      </header>

      <!-- 核心流程图 -->
      <div class="workflow-grid">
        <!-- 左侧：输入与处理 -->
        <div class="stage-section input-processing">
          <div class="glass-card node-card start-node" data-label="Input">
            <div class="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </div>
            <span class="node-title">原始文本</span>
          </div>

          <!-- 动态连接线 -->
          <div class="connection-line horizontal">
            <div class="flowing-dot"></div>
          </div>

          <div class="glass-card node-card process-node" data-label="OCR">
            <div class="icon-wrapper scanner-effect">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
              </svg>
            </div>
            <span class="node-title">智能OCR识别</span>
          </div>

          <!-- OCR 分流结果 -->
          <div class="ocr-branches">
            <div class="branch-line-container">
              <svg class="branch-svg" viewBox="0 0 100 80" preserveAspectRatio="none">
                <path d="M0,40 C30,40 30,10 60,10 H100" class="branch-path"></path>
                <path d="M0,40 H100" class="branch-path"></path>
                <path d="M0,40 C30,40 30,70 60,70 H100" class="branch-path"></path>
              </svg>
            </div>
            <div class="branch-nodes">
              <div class="mini-node"><span class="mini-icon">M</span><span class="mini-text">Markdown</span></div>
              <div class="mini-node"><span class="mini-icon">IMG</span><span class="mini-text">图像</span></div>
              <div class="mini-node"><span class="mini-icon">TBL</span><span class="mini-text">表格</span></div>
            </div>
          </div>
        </div>

        <!-- 连接到中间库 -->
        <div class="main-connector">
          <svg class="flow-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0,10 H100" class="main-path"></path>
            <circle class="flow-particle" r="2" cx="0" cy="10">
              <animateMotion dur="2s" repeatCount="indefinite" path="M0,10 H100" />
            </circle>
          </svg>
        </div>

        <!-- 中间：包含中间成果库和治理 -->
        <div class="stage-section storage-governance">
          <!-- 中间成果库 -->
          <div class="glass-card node-card db-card">
            <div class="icon-wrapper db-icon">
              <!-- Database Icon -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
              <div class="db-glow"></div>
            </div>
            <div class="card-content">
              <span class="node-title large">中间成果库</span>
              <span class="node-desc">Intermediate Result Storage</span>
            </div>
          </div>

          <!-- 分流到治理 -->
          <div class="governance-split">
             <div class="split-connector-up"></div>
             <div class="split-connector-down"></div>
          </div>

          <!-- 右侧：治理模块 -->
          <div class="governance-modules">
            <!-- 目录治理 -->
            <div class="glass-card feature-card">
              <div class="feature-icon icon-tree">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <path d="M10 6.5h4"></path>
                  <path d="M6.5 10v8a2 2 0 0 0 2 2h5.5"></path>
                </svg>
              </div>
              <div class="feature-text">
                <h3>目录体系治理</h3>
                <p>Structure Governance</p>
                <div class="tags">
                  <span>拆解</span>
                  <span>重构</span>
                  <span>细化</span>
                </div>
              </div>
            </div>

            <!-- 引文治理 -->
            <div class="glass-card feature-card">
              <div class="feature-icon icon-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <div class="feature-text">
                <h3>引文治理</h3>
                <p>Citation Governance</p>
                <div class="tags">
                  <span>原文对照</span>
                  <span>精准溯源</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部：元数据 -->
      <footer class="metadata-section">
        <div class="metadata-bar">
          <div class="meta-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
          </div>
          <div class="meta-info">
            <span class="meta-title">元数据全周期追踪 (Metadata Traceability)</span>
            <span class="meta-desc">Recording every step of data transformation</span>
          </div>
        </div>
        <!-- 向上连接的虚线 -->
        <div class="meta-connections">
          <div class="v-line" style="left: 15%"></div>
          <div class="v-line" style="left: 45%"></div>
          <div class="v-line" style="left: 80%"></div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
// Apple-style Workflow Component
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.apple-workflow-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fbfbfd; /* Apple 经典背景色 */
  color: #1d1d1f;
  font-family: "SF Pro Text", "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 动感极光背景 - 明亮版 */
.aurora-bg {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  /* 使用柔和的蓝紫渐变，营造通透感 */
  background: radial-gradient(circle at 50% 50%, rgba(0, 122, 255, 0.05), transparent 60%),
              radial-gradient(circle at 80% 20%, rgba(88, 86, 214, 0.05), transparent 40%),
              radial-gradient(circle at 20% 80%, rgba(52, 199, 89, 0.05), transparent 50%);
  filter: blur(80px);
  animation: aurora-move 20s infinite alternate linear;
  z-index: 0;
}

@keyframes aurora-move {
  0% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(10deg) scale(1.1); }
}

.content-wrapper {
  position: relative;
  z-index: 10;
  width: 90%;
  max-width: 1400px;
  height: 90%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 标题 */
.header-section {
  text-align: center;
  margin-top: 20px;
}

.main-title {
  font-size: 40px;
  font-weight: 700;
  /* 深色渐变标题 */
  background: linear-gradient(135deg, #1d1d1f 0%, #48484a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #86868b;
  font-size: 18px;
  margin-top: 8px;
  font-weight: 400;
}

/* 主布局 */
.workflow-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding: 40px 0;
}

/* 玻璃拟态卡片通用样式 - 明亮版 */
.glass-card {
  background: rgba(255, 255, 255, 0.7); /* 高透白 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  /* 柔和的阴影 */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.glass-card:hover {
  transform: translateY(-5px) scale(1.02);
  border-color: rgba(0, 122, 255, 0.2);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

/* 左侧：输入 */
.stage-section.input-processing {
  display: flex;
  align-items: center;
}

.node-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  min-width: 140px;
  gap: 16px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  /* 浅灰色背景 */
  background: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d1d1f;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.icon-wrapper svg {
  width: 28px;
  height: 28px;
  stroke-width: 1.5;
}

.node-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
}

/* 扫描仪动画 */
.scanner-effect {
  position: relative;
  overflow: hidden;
}
.scanner-effect::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #007aff;
  box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* 连接线 - 明亮版 */
.connection-line {
  width: 60px;
  height: 2px;
  background: rgba(0, 0, 0, 0.05); /* 浅灰色线条 */
  position: relative;
  margin: 0 10px;
}

.flowing-dot {
  position: absolute;
  top: -2px;
  left: 0;
  width: 6px;
  height: 6px;
  background: #007aff; /* Apple Blue */
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 122, 255, 0.4);
  animation: flowHorizontal 1.5s linear infinite;
}

@keyframes flowHorizontal {
  0% { left: 0; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}

/* OCR 分支 */
.ocr-branches {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 20px;
}

.branch-line-container {
  width: 40px;
  height: 80px;
}

.branch-path {
  fill: none;
  stroke: rgba(0, 0, 0, 0.1); /* 浅灰色虚线 */
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
}

.branch-nodes {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 140px;
  margin-left: 10px;
}

.mini-node {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1d1d1f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.mini-icon {
  font-weight: 700;
  color: #007aff;
  font-size: 11px;
}

/* 主连接器 */
.main-connector {
  flex: 1;
  height: 20px;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.flow-svg {
  width: 100%;
  height: 100%;
}

.main-path {
  stroke: rgba(0, 0, 0, 0.08);
  stroke-width: 2;
  stroke-dasharray: 6 6;
  fill: none;
}

.flow-particle {
  fill: #007aff;
  filter: drop-shadow(0 0 2px rgba(0, 122, 255, 0.5));
}

/* 中间部分 */
.stage-section.storage-governance {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 60px;
}

.db-card {
  padding: 30px;
  min-width: 180px;
  /* 数据库卡片保持轻微的特别背景，但改为浅色 */
  background: linear-gradient(135deg, #f5f5f7, #ffffff);
  border: 1px solid rgba(0, 122, 255, 0.1);
}

.db-icon {
  width: 72px;
  height: 72px;
  /* 蓝色渐变图标背景 */
  background: linear-gradient(135deg, #007aff, #0051a8);
  color: #fff; /* 图标保持白色 */
  border: none;
  box-shadow: 0 10px 20px rgba(0, 122, 255, 0.2);
}

.node-title.large {
  font-size: 18px;
  margin-top: 10px;
  display: block;
}

.node-desc {
  font-size: 12px;
  color: #86868b;
}

/* 治理模块 */
.governance-modules {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-card {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  width: 320px;
  gap: 20px;
  cursor: pointer;
  background: #fff; /* 纯白卡片 */
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
  background: #f5f5f7;
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: #f5f5f7; /* 浅灰底 */
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.icon-tree { color: #34c759; /* Apple Green */ }
.icon-link { color: #ff9500; /* Apple Orange */ }

.feature-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.feature-text p {
  margin: 2px 0 8px 0;
  font-size: 12px;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tags {
  display: flex;
  gap: 8px;
}

.tags span {
  font-size: 11px;
  padding: 2px 8px;
  background: #f2f2f7;
  border-radius: 10px;
  color: #636366;
  font-weight: 500;
}

/* 底部元数据 */
.metadata-section {
  position: relative;
  width: 100%;
  height: 60px;
  margin-bottom: 20px;
}

.metadata-bar {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 30px;
  display: flex;
  align-items: center;
  padding: 0 30px;
  gap: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.meta-icon {
  color: #af52de; /* Apple Purple */
}

.meta-icon svg {
  width: 24px;
  height: 24px;
}

.meta-info {
  display: flex;
  flex-direction: column;
}

.meta-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.meta-desc {
  font-size: 12px;
  color: #86868b;
}

.meta-connections {
  position: absolute;
  top: -40px; /* 连接到上方 */
  left: 0;
  width: 100%;
  height: 40px;
  pointer-events: none;
}

.v-line {
  position: absolute;
  width: 1px;
  height: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.1), transparent);
  border-left: 1px dashed rgba(0, 0, 0, 0.15);
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .workflow-grid {
    flex-direction: column;
    gap: 40px;
  }
  
  .main-connector {
    transform: rotate(90deg);
    width: 20px;
    height: 60px;
  }
}
</style>
