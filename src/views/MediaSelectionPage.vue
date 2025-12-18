<template>
  <div class="media-selection-container">
    <!-- Background Elements -->
    <div class="cosmic-bg">
      <div class="stars"></div>
      <div class="twinkling"></div>
    </div>

    <!-- Main Content -->
    <div class="content-wrapper">
      <!-- Header Section -->
      <header class="header-section">
        <h1 class="main-title">多模态数据治理平台</h1>
        <p class="subtitle">Multimodal Data Governance Platform</p>
      </header>

      <!-- Media Concepts Section -->
      <div class="media-concepts">
        <div class="concept-card" v-for="(concept, index) in mediaConcepts" :key="index">
          <div class="concept-icon" :class="{ 'has-logo': concept.logo }">
            <img v-if="concept.logo" :src="concept.logo" :alt="concept.title" class="concept-logo-img" />
            <span v-else>{{ concept.icon }}</span>
          </div>
          <h3>{{ concept.title }}</h3>
          <p>{{ concept.description }}</p>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider-section">
        <div class="divider-line"></div>
        <div class="divider-text">选择媒体类型进入系统</div>
        <div class="divider-line"></div>
      </div>

      <!-- Six Media Elements Grid -->
      <div class="media-grid">
        <div 
          v-for="(element, index) in mediaElements" 
          :key="index"
          class="media-card"
          @click="navigateToMedia(element)"
        >
          <div class="card-inner">
            <div class="card-icon" v-html="element.svgIcon"></div>
            <h3 class="card-title">{{ element.title }}</h3>
            <p class="card-description">{{ element.description }}</p>
            <div class="card-hover-effect">
              <span>点击进入</span>
              <i class="arrow-icon">→</i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Three Media Concepts (3)
const mediaConcepts = ref([
  {
    title: '多媒体',
    description: '整合文本、图像、音频、视频等多种信息载体',
    icon: '📱'
  },
  {
    title: '全媒体',
    description: '覆盖所有媒介形态的全方位信息传播',
    icon: '🌐'
  },
  {
    title: '融媒体',
    description: '深度融合各类媒体资源实现协同创新',
    logo: new URL('../assets/geographic-multimodal-logo.png', import.meta.url).href
  }
]);

// Six Media Elements (6) with Premium SVG Icons
const mediaElements = ref([
  {
    title: '文本',
    description: '文档处理与知识图谱',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    route: 'text'
  },
  {
    title: '图像',
    description: '图片识别与智能分析',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    route: 'image'
  },
  {
    title: '视频',
    description: '视频处理与内容提取',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
    route: 'video'
  },
  {
    title: '音频',
    description: '音频分析与语音识别',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
    route: 'audio'
  },
  {
    title: '图表',
    description: '数据可视化与分析',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`,
    route: 'chart'
  },
  {
    title: '地图',
    description: '地理信息与空间分析',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
    route: 'map'
  }
]);

const navigateToMedia = (element: any) => {
  router.push(`/dashboard/${element.route}`);
};
</script>

<style scoped>
/* Container */
.media-selection-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

/* Cosmic Background */
.cosmic-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVQIW2NkYGD4z8DAwAAACgAD/il4QJ8AAAAASUVORK5CYII=') repeat;
  opacity: 0.4;
}

.twinkling {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVQIW2NkYGD4z8DAwAAACgAD/il4QJ8AAAAASUVORK5CYII=') repeat;
  animation: twinkling 200s linear infinite;
  opacity: 0.2;
}

@keyframes twinkling {
  0% { transform: translateY(0); }
  100% { transform: translateY(-2000px); }
}

/* Content Wrapper */
.content-wrapper {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  width: 100%;
}

/* Header Section */
.header-section {
  text-align: center;
  margin-bottom: 60px;
}

.main-title {
  font-size: 56px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
  letter-spacing: 2px;
  animation: titleGlow 3s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 4px;
  text-transform: uppercase;
  font-weight: 300;
}

/* Media Concepts Section */
.media-concepts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-bottom: 60px;
}

.concept-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.concept-card:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 16px 48px rgba(102, 126, 234, 0.2);
}

.concept-icon {
  font-size: 48px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

.concept-icon.has-logo {
  font-size: inherit;
}

.concept-logo-img {
  height: 60px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3));
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.concept-card h3 {
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
}

.concept-card p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
}

/* Divider Section */
.divider-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 60px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent);
}

.divider-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
  white-space: nowrap;
}

/* Media Grid */
.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.media-card {
  cursor: pointer;
  perspective: 1000px;
}

.card-inner {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 50px 30px;
  text-align: center;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.media-card:hover .card-inner {
  transform: translateY(-15px) scale(1.02);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
}

.media-card:hover .card-inner::before {
  opacity: 1;
}

.card-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea; /* 默认图标颜色 */
}

.card-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.media-card:hover .card-icon {
  transform: scale(1.2) rotate(5deg);
  color: #764ba2;
}

.card-title {
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.card-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 20px;
}

.card-hover-effect {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

.media-card:hover .card-hover-effect {
  opacity: 1;
  transform: translateY(0);
}

.arrow-icon {
  font-style: normal;
  display: inline-block;
  transition: transform 0.3s ease;
}

.media-card:hover .arrow-icon {
  transform: translateX(5px);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .media-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .media-concepts {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 36px;
  }

  .subtitle {
    font-size: 14px;
  }

  .media-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .media-concepts {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .concept-card {
    padding: 30px 20px;
  }

  .card-inner {
    padding: 40px 20px;
  }
}
</style>
