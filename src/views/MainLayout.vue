<template>
  <div class="main-layout">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-brand">
        <div class="logo-ring">
          <div class="ring-inner"></div>
        </div>
        <span class="brand-text">GEOGRAPHIC MULTIMODAL</span>
      </div>
      
      <nav class="nav-items">
        <div 
          v-for="(item, index) in navItems" 
          :key="index"
          class="nav-item"
          :class="{ active: currentRoute === item.path }"
          @click="handleNavClick(item)"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
          <div class="nav-indicator"></div>
        </div>
      </nav>

      <div class="nav-right">
        <div class="time-display">{{ currentTime }}</div>
        <div class="user-profile">
          <el-avatar :size="32" class="user-avatar">AD</el-avatar>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="content-area">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  Document, Picture, VideoPlay, Headset, 
  DataLine, MapLocation, Connection, Box, Setting 
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const currentTime = ref('');
let timeInterval: any;

const navItems = [
  { label: '文本', path: 'text', icon: 'Document' },
  { label: '图像', path: 'image', icon: 'Picture' },
  { label: '视频', path: 'video', icon: 'VideoPlay' },
  { label: '音频', path: 'audio', icon: 'Headset' },
  { label: '图表', path: 'chart', icon: 'DataLine' },
  { label: '地图', path: 'map', icon: 'MapLocation' }
];

const currentRoute = computed(() => {
  const path = route.path.split('/').pop();
  return path || 'text';
});

const handleNavClick = (item: any) => {
  router.push(`/dashboard/${item.path}`);
};

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('en-US', { hour12: false });
};

onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #0b1121;
  color: #fff;
  overflow: hidden;
}

/* Top Navigation */
.top-nav {
  height: 90px;
  background: #0b1121;
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  backdrop-filter: blur(10px);
}

.nav-brand {
  display: flex;
  align-items: center;
  width: 320px;
  gap: 16px;
}

.logo-ring {
  width: 32px;
  height: 32px;
  border: 2px solid #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

.ring-inner {
  width: 16px;
  height: 16px;
  background-color: #3b82f6;
  border-radius: 50%;
}

.brand-text {
  font-family: 'Segoe UI', sans-serif;
  font-weight: 800;
  font-size: 24px;
  letter-spacing: 1.5px;
  background: linear-gradient(90deg, #fff, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
}

.nav-items {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 24px;
  height: 100%;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 40px;
  cursor: pointer;
  position: relative;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: #94a3b8;
  height: 100%;
  min-width: 140px;
  border-bottom: 4px solid transparent;
}

.nav-item:hover {
  color: #fff;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.05) 100%);
}

.nav-item.active {
  color: #10b981;
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.15) 100%);
  border-bottom-color: #10b981;
}

.nav-item.active .nav-icon {
  transform: translateY(-2px);
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.6));
}

.nav-icon {
  font-size: 34px;
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.nav-indicator {
  display: none; /* Removed in favor of border-bottom */
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 240px;
  justify-content: flex-end;
}

.time-display {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.user-avatar {
  background: linear-gradient(135deg, #10b981, #3b82f6);
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.1);
  border-color: #10b981;
}

/* Content Area */
.content-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #05080f;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
</style>
