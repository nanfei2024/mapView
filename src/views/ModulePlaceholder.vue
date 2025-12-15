<template>
  <div class="module-placeholder">
    <!-- 背景网格 -->
    <div class="tech-grid"></div>
    
    <!-- 全息投影容器 -->
    <div class="hologram-container">
      <!-- 旋转的外环 -->
      <div class="ring ring-outer"></div>
      <div class="ring ring-middle"></div>
      <div class="ring ring-inner"></div>
      
      <!-- 核心图标 -->
      <div class="core-icon-wrapper">
        <el-icon :size="80" class="core-icon"><component :is="iconName" /></el-icon>
      </div>
      
      <!-- 扫描光效 -->
      <div class="scanner-light"></div>
      
      <!-- 装饰性数据点 -->
      <div class="data-particles">
        <span v-for="n in 8" :key="n" class="particle" :style="{ '--i': n }"></span>
      </div>
    </div>

    <!-- 文本信息 -->
    <div class="info-panel">
      <h2 class="module-title" data-text="{{ title }}">{{ title }}</h2>
      <div class="status-bar">
        <span class="status-text">SYSTEM INITIALIZING</span>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
      <p class="module-desc">Multimodal Data Processing Module</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Picture, VideoPlay, Headset, 
  DataLine, MapLocation, Connection, Box, Setting 
} from '@element-plus/icons-vue';

const route = useRoute();

const moduleMap: Record<string, { title: string, icon: string }> = {
  image: { title: '图像处理', icon: 'Picture' },
  video: { title: '视频分析', icon: 'VideoPlay' },
  audio: { title: '音频识别', icon: 'Headset' },
  chart: { title: '数据图表', icon: 'DataLine' },
  map: { title: '地图服务', icon: 'MapLocation' },
  knowledge: { title: '知识图谱', icon: 'Connection' },
  '3d': { title: '三维模型', icon: 'Box' },
  system: { title: '系统设置', icon: 'Setting' }
};

const currentModule = computed(() => {
  const path = route.path.split('/').pop() || '';
  return moduleMap[path] || { title: '未知模块', icon: 'Setting' };
});

const title = computed(() => currentModule.value.title);
const iconName = computed(() => currentModule.value.icon);
</script>

<style scoped>
.module-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  color: #fff;
  background: radial-gradient(circle at center, #1e293b 0%, #020617 100%);
  position: relative;
  overflow: hidden;
  perspective: 1000px;
}

/* 背景动态网格 */
.tech-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  background-image: 
    linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px);
  background-size: 60px 60px;
  transform: rotateX(60deg) translateY(-20%) translateZ(-100px);
  animation: gridMove 20s linear infinite;
  pointer-events: none;
}

@keyframes gridMove {
  0% { transform: rotateX(60deg) translateY(0) translateZ(-100px); }
  100% { transform: rotateX(60deg) translateY(60px) translateZ(-100px); }
}

/* 全息容器 */
.hologram-container {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-style: preserve-3d;
  margin-bottom: 40px;
}

/* 旋转光环 */
.ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
}

.ring-outer {
  width: 100%;
  height: 100%;
  border-top: 4px solid #10b981;
  border-bottom: 4px solid #10b981;
  animation: rotate 8s linear infinite;
}

.ring-middle {
  width: 75%;
  height: 75%;
  border-left: 3px solid #3b82f6;
  border-right: 3px solid #3b82f6;
  animation: rotateReverse 6s linear infinite;
}

.ring-inner {
  width: 50%;
  height: 50%;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  animation: rotate 4s linear infinite;
}

/* 核心图标 */
.core-icon-wrapper {
  z-index: 10;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.8));
}

.core-icon {
  color: #fff;
}

/* 扫描光效 */
.scanner-light {
  position: absolute;
  width: 100%;
  height: 10px;
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.8), transparent);
  top: 0;
  opacity: 0.5;
  animation: scan 3s linear infinite;
  box-shadow: 0 0 15px #10b981;
}

/* 粒子系统 */
.data-particles .particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform-origin: 150px 0; /* 围绕中心旋转 */
  animation: orbit 5s linear infinite;
  animation-delay: calc(var(--i) * -0.6s);
  box-shadow: 0 0 10px #3b82f6;
}

/* 信息面板 */
.info-panel {
  text-align: center;
  z-index: 10;
  background: rgba(13, 22, 35, 0.8);
  padding: 30px 50px;
  border-radius: 16px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  transform: translateZ(50px);
}

.module-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 20px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 4px;
  position: relative;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.status-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.status-text {
  color: #10b981;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  letter-spacing: 2px;
  animation: blink 1s infinite;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  width: 50%;
  height: 100%;
  background: #10b981;
  animation: progress 2s ease-in-out infinite;
  box-shadow: 0 0 10px #10b981;
}

.module-desc {
  color: #94a3b8;
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 动画定义 */
@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes rotateReverse {
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes scan {
  0% { top: 0; opacity: 0; }
  20% { opacity: 0.8; }
  80% { opacity: 0.8; }
  100% { top: 100%; opacity: 0; }
}

@keyframes orbit {
  0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes progress {
  0% { width: 0%; margin-left: 0; }
  50% { width: 100%; margin-left: 0; }
  100% { width: 0%; margin-left: 100%; }
}
</style>
