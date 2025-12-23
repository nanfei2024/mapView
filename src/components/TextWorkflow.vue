<template>
  <div class="apple-workflow-container">
    <div class="aurora-bg"></div>
    
    <div class="content-wrapper">
      <!-- Top Navigation Tabs -->
      <div class="top-nav-tabs">
        <div class="nav-tab active">书籍</div>
        <div class="nav-tab" @click="handleTabClick('论文')">论文</div>
        <div class="nav-tab" @click="handleTabClick('报告')">报告</div>
      </div>

      <header class="header-section">
        <h1 class="main-title">书籍治理流程</h1>
        <p class="subtitle">全链路数字化 · 智能化重构 · 精细化治理</p>
      </header>

      <!-- 主流程区域 -->
      <div class="workflow-main">
        
        <!-- 区域 1: 原始库 -->
        <div class="zone zone-original">
          <div class="zone-content">
            <div class="process-group">
              <!-- 扫描文件上传 -->
              <div class="glass-card node-card start-node">
                <div class="icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <polyline points="9 15 12 12 15 15"></polyline>
                  </svg>
                </div>
                <span class="node-title">扫描文件上传</span>
              </div>

              <!-- 连接箭头 -->
              <div class="connection-arrow">→</div>

              <!-- 智能OCR -->
              <div class="glass-card node-card process-node">
                <div class="icon-wrapper scanner-effect">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                  </svg>
                </div>
                <span class="node-title">智能OCR识别</span>
              </div>
            </div>
          </div>
          <!-- 区域标签 -->
          <div class="zone-label-bar original-bar"></div>
        </div>

        <!-- 流程连接 -->
        <div class="zone-connector">
          <div class="zone-arrow">➔</div>
        </div>

        <!-- 区域 2: 中间库 -->
        <div class="zone zone-middleware">
          <div class="zone-content">
            <div class="middleware-group">
              <!-- OCR 结果 (放大的卡片) - 移到这里 -->
              <div class="ocr-results-group">
                <div class="result-card">
                  <span class="mini-icon blue">M</span>
                  <span>Markdown</span>
                </div>
                <div class="result-card">
                  <span class="mini-icon green">IMG</span>
                  <span>图像</span>
                </div>
                <div class="result-card">
                  <span class="mini-icon orange">TBL</span>
                  <span>表格</span>
                </div>
              </div>

              <!-- 箭头 -->
              <div class="connection-arrow">→</div>

              <!-- 中间成果库 -->
              <div class="glass-card node-card db-card">
                <div class="icon-wrapper db-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  </svg>
                </div>
                <span class="node-title large">中间成果库</span>
              </div>
            </div>
          </div>
          <div class="zone-label-bar middleware-bar"></div>
        </div>

        <!-- 流程连接 -->
        <div class="zone-connector">
          <div class="zone-arrow">➔</div>
        </div>

        <!-- 区域 3: 成果库 -->
        <div class="zone zone-result">
          <div class="zone-content">
            <div class="governance-grid">
              <!-- 目录体系治理 -->
              <div class="glass-card gov-card">
                <div class="gov-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><path d="M10 6.5h4"></path><path d="M6.5 10v8a2 2 0 0 0 2 2h5.5"></path></svg>
                </div>
                <span>目录体系治理</span>
              </div>

              <!-- 图档治理 -->
              <div class="glass-card gov-card">
                <div class="gov-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </div>
                <span>图档治理</span>
              </div>

              <!-- 引文治理 -->
              <div class="glass-card gov-card">
                <div class="gov-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
                <span>引文治理</span>
              </div>

              <!-- 表档治理 -->
              <div class="glass-card gov-card">
                <div class="gov-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                </div>
                <span>表档治理</span>
              </div>
            </div>
          </div>
          <div class="zone-label-bar result-bar"></div>
        </div>

        <!-- 流程连接 -->
        <div class="zone-connector">
          <div class="zone-arrow">➔</div>
        </div>

        <!-- 区域 4: 发布库 -->
        <div class="zone zone-publish">
          <div class="zone-content">
            <div class="glass-card node-card publish-card">
              <div class="icon-wrapper publish-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21.2 15c.7 0 1.3-1.4 1.3-3s-.6-3-1.3-3S19.9 10.4 19.9 12s.6 3 1.3 3z"></path>
                  <path d="M18.6 19.3c.5.3.8-.7 1.3-1.2.5-.5 1.5-.2 1.2-.7-.3-.5-.7-.8-1.2-1.3-.5-.5-.2-1.5.7-1.2.5.3.8.7 1.3 1.2"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M2 12h20"></path>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <span class="node-title large">发布库</span>
            </div>
          </div>
          <div class="zone-label-bar publish-bar"></div>
        </div>

      </div>

      <!-- 底部：元数据 (大幅上移) -->
      <div class="metadata-wrapper">
        <!-- 垂直连接线 -->
        <div class="meta-v-lines">
          <div class="meta-vl" style="left: 15%"></div>
          <div class="meta-vl" style="left: 40%"></div>
          <div class="meta-vl" style="left: 65%"></div>
          <div class="meta-vl" style="left: 90%"></div>
        </div>

        <div class="metadata-bar-large">
          <div class="meta-icon-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
          </div>
          <span class="meta-title-large">元数据库 (Metadata Traceability) — 全过程数据记录与溯源</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';

// 处理标签点击
const handleTabClick = (name: string) => {
  ElMessage.info(`${name}治理功能正在开发中...`);
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.apple-workflow-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fbfbfd;
  color: #1d1d1f;
  font-family: "SF Pro Text", "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.aurora-bg {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
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
  width: 98%; /* 增加宽度占比 */
  max-width: 1800px; /* 增加最大宽度 */
  height: 95%;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中 */
}

/* Top Navigation Tabs Styling */
.top-nav-tabs {
  position: absolute;
  top: 0;
  left: 40px;
  display: flex;
  gap: 12px;
  z-index: 100;
}

.nav-tab {
  padding: 10px 24px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.nav-tab:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.nav-tab.active {
  background: #007aff;
  color: white;
  border-color: #007aff;
  box-shadow: 0 8px 16px rgba(0, 122, 255, 0.3);
}


.header-section {
  text-align: center;
  margin-bottom: 50px;
  flex-shrink: 0;
}

.main-title {
  font-size: 42px; /* 放大标题 */
  font-weight: 700;
  background: linear-gradient(135deg, #1d1d1f 0%, #48484a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.subtitle {
  color: #86868b;
  font-size: 18px;
  margin-top: 8px;
}

/* 核心网格布局 */
.workflow-main {
  display: flex;
  align-items: stretch; /* 拉伸高度一致 */
  justify-content: center; /* 水平居中 */
  gap: 20px; /* 增加间距 */
  padding: 0 40px;
  margin-bottom: 20px;
}

/* 区域通用样式 */
.zone {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 30px; /* 增加内边距 */
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px dashed rgba(0, 0, 0, 0.08); /* 加深一点边框 */
  transition: all 0.3s ease;
  position: relative;
}

.zone:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 122, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  transform: translateY(-5px);
}

.zone-content {
  min-height: 320px; /* 大幅增加高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.zone-label-bar {
  height: 10px; /* 加粗底部条 */
  width: 100%;
  border-radius: 5px;
  position: relative;
  margin-top: auto;
}

/* 自定义底部标签文字 */
.zone-label-bar::before {
  content: ''; 
  position: absolute;
  top: 16px; /* 调整文字位置 */
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px; /* 16px -> 20px */
  font-weight: 700;
  color: #6e6e73;
  white-space: nowrap;
}

.original-bar { background: #ff3b30; box-shadow: 0 2px 10px rgba(255, 59, 48, 0.3); }
.original-bar::before { content: '原始库'; color: #ff3b30; }

.middleware-bar { background: #007aff; box-shadow: 0 2px 10px rgba(0, 122, 255, 0.3); }
.middleware-bar::before { content: '中间库'; color: #007aff; }

.result-bar { background: #34c759; box-shadow: 0 2px 10px rgba(52, 199, 89, 0.3); }
.result-bar::before { content: '成果库'; color: #34c759; }

.publish-bar { background: #af52de; box-shadow: 0 2px 10px rgba(175, 82, 222, 0.3); }
.publish-bar::before { content: '发布库'; color: #af52de; }

/* 区域比例微调 */
.zone-original { flex: 0.9; }
.zone-middleware { flex: 1.2; }
.zone-result { flex: 1.4; }
.zone-publish { flex: 0.8; }

.process-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.connection-arrow {
  color: #86868b;
  font-size: 32px; /* Increased from 24px */
  font-weight: 700; /* Bold */
  margin: 0 10px;
  transform: scaleX(1.2); /* Make it stretch a bit */
}

.ocr-results-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 200px; /* 增加高度 */
  justify-content: space-between;
}

.result-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 12px;
  padding: 16px 20px; /* Increased padding */
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px; /* 14px -> 18px */
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
  min-width: 160px; /* Increased width */
}

.mini-icon {
  width: 32px; /* 放大图标 */
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
}
.mini-icon.blue { background: #007aff; }
.mini-icon.green { background: #34c759; }
.mini-icon.orange { background: #ff9500; }

.middleware-group {
  display: flex;
  align-items: center;
  gap: 30px; /* 增加间距 */
}

.db-card {
  padding: 30px;
  background: #fff;
  border: 1px solid rgba(0, 122, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  min-width: 160px;
}

.db-icon {
  width: 80px; /* 放大图标 */
  height: 80px;
  background: linear-gradient(135deg, #007aff, #0051a8);
  color: white;
  margin-bottom: 0;
}

.governance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px; /* 增加网格间距 */
  width: 100%;
}

.gov-card {
  background: #fff;
  padding: 24px; /* 增加内边距 */
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 16px;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.02);
}

.gov-card span {
  font-size: 18px; /* 15px -> 18px */
  font-weight: 600;
}

.gov-card:hover { 
  transform: translateY(-5px); 
  box-shadow: 0 10px 25px rgba(0,0,0,0.05); 
}

.gov-icon {
  width: 48px; /* 放大图标 */
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f2f7;
}

.gov-icon svg { width: 26px; height: 26px; }
.gov-icon.green { color: #34c759; }
.gov-icon.purple { color: #af52de; }
.gov-icon.orange { color: #ff9500; }
.gov-icon.blue { color: #007aff; }

.publish-card {
  padding: 30px;
  background: #fff;
  border: 1px solid rgba(175, 82, 222, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  min-width: 140px;
}

.publish-icon {
  width: 80px; /* 放大图标 */
  height: 80px;
  background: linear-gradient(135deg, #af52de, #5856d6);
  color: white;
  margin-bottom: 0;
}

/* 连接器 */
.zone-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px; /* 稍微缩短连接距，让内容更紧凑 */
}

.zone-arrow {
  font-size: 28px;
  color: #86868b;
  font-weight: bold;
  opacity: 0.6;
}

/* 底部元数据 */
.metadata-wrapper {
  margin-top: 50px;
  position: relative;
  width: 100%;
  padding: 0 40px;
}

.meta-v-lines {
  position: absolute;
  top: -50px;
  left: 0;
  width: 100%;
  height: 50px;
  pointer-events: none;
}

.meta-vl {
  position: absolute;
  width: 1px;
  height: 100%;
  background: linear-gradient(to top, #e5e5ea, transparent);
  border-left: 1px dashed #c7c7cc;
}

.metadata-bar-large {
  width: 100%;
  height: 100px; /* 增加高度 */
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.06); /* 增强阴影 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  border: 1px solid rgba(0,0,0,0.02);
}

.meta-icon-large {
  color: #ff2d55;
  width: 48px;
  height: 48px;
}

.meta-icon-large svg { width: 100%; height: 100%; }

.meta-title-large {
  font-size: 26px; /* 22px -> 26px */
  font-weight: 700;
  color: #1d1d1f;
}

/* 通用节点样式 */
.node-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-wrapper {
  width: 64px; /* 放大图标容器 */
  height: 64px;
  border-radius: 16px;
  background: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d1d1f;
  margin-bottom: 12px;
}

.icon-wrapper svg { width: 32px; height: 32px; }

.node-title {
  font-size: 18px; /* 15px -> 18px */
  font-weight: 600;
  color: #1d1d1f;
}

.glass-card {
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px; /* 增加圆角 */
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  transition: all 0.3s;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
</style>
