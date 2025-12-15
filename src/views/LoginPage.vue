<template>
  <div class="split-layout">
    <!-- Left Panel: Dark Brand/Vibe -->
    <div class="left-panel">
      <!-- Starry Background Canvas -->
      <canvas ref="starCanvas" class="star-canvas"></canvas>
      
      <!-- Atmospheric Earth Glow (CSS) -->
      <div class="earth-horizon"></div>

      <div class="brand-content">
        <h1 class="brand-title">地理多模态<br>智算系统</h1>
        <p class="brand-subtitle">Spatial Intelligence Platform</p>
        
        <div class="feature-list">
          <div class="feature-item">
            <span class="icon">✦</span>
            <span>全方位地理数据融合</span>
          </div>
          <div class="feature-item">
            <span class="icon">✦</span>
            <span>实时多维可视化分析</span>
          </div>
          <div class="feature-item">
            <span class="icon">✦</span>
            <span>智能决策支持引擎</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Login & Floating Nodes -->
    <div class="right-panel">
      <div class="login-center-wrapper">
        
        <!-- Floating Nodes Orbit -->
        <div class="orbit-container">
          <!-- Connection Lines (Optional, SVG layer behind) -->
          <svg class="orbit-connections" viewBox="0 0 1000 1000">
            <circle cx="500" cy="500" r="380" class="orbit-path-ring" />
          </svg>

          <!-- Node 1: Map (Top) -->
          <div class="orbit-node pos-1 blue">
            <div class="node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 13l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 13V7m0 0L9 7" /></svg>
            </div>
            <span class="node-label">地图</span>
          </div>

          <!-- Node 2: Text (Top Right) -->
          <div class="orbit-node pos-2 purple">
             <div class="node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
             </div>
            <span class="node-label">文本</span>
          </div>

          <!-- Node 3: Image (Bottom Right) -->
          <div class="orbit-node pos-3 orange">
             <div class="node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
             </div>
            <span class="node-label">图像</span>
          </div>

          <!-- Node 4: Audio (Bottom) -->
          <div class="orbit-node pos-4 green">
             <div class="node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
             </div>
            <span class="node-label">音频</span>
          </div>

          <!-- Node 5: Video (Bottom Left) -->
          <div class="orbit-node pos-5 yellow">
             <div class="node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
             </div>
            <span class="node-label">视频</span>
          </div>

           <!-- Node 6: Chart (Top Left) -->
          <div class="orbit-node pos-6 red">
             <div class="node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
             </div>
            <span class="node-label">图表</span>
          </div>
        </div>

        <div class="login-form-container">
          <h2 class="form-title">Log in to your account</h2>
          
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="clean-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <div class="input-label">EMAIL OR USERNAME</div>
              <el-input
                v-model="loginForm.username"
                placeholder="name@example.com"
                class="minimal-input"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <div class="input-label">PASSWORD</div>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="Password"
                show-password
                class="minimal-input"
              />
            </el-form-item>

            <el-button
              type="primary"
              :loading="loading"
              class="minimal-button"
              @click="handleLogin"
            >
              Log In
            </el-button>
            
            <div class="extra-actions">
              <span class="forgot-pwd">Forgot password?</span>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const starCanvas = ref<HTMLCanvasElement | null>(null)
const globeCanvas = ref<HTMLCanvasElement | null>(null)

// --- Starry Sky Animation ---
let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number
const stars: Star[] = []
const STAR_COUNT = 200

class Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  
  constructor(width: number, height: number) {
    this.x = Math.random() * width
    this.y = Math.random() * height
    this.size = Math.random() * 2
    this.opacity = Math.random()
    this.speed = Math.random() * 0.05 + 0.01
  }
  
  update() {
    this.opacity += this.speed
    if (this.opacity > 1 || this.opacity < 0) this.speed = -this.speed
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(this.opacity)})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

const initStars = () => {
  if (!starCanvas.value) return
  const width = starCanvas.value.width
  const height = starCanvas.value.height
  stars.length = 0
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star(width, height))
  }
}

const animateStars = () => {
  if (!starCanvas.value || !ctx) return
  ctx.clearRect(0, 0, starCanvas.value.width, starCanvas.value.height)
  stars.forEach(star => {
    star.update()
    star.draw(ctx!)
  })
  animationFrameId = requestAnimationFrame(animateStars)
}

const handleResize = () => {
  if (!starCanvas.value) return
  const parent = starCanvas.value.parentElement
  if (parent) {
    starCanvas.value.width = parent.clientWidth
    starCanvas.value.height = parent.clientHeight
    initStars()
  }
}

// --- Globe Animation (Left Panel) ---
// Simplified dot globe for left panel
let globeCtx: CanvasRenderingContext2D | null = null
const globeDots: GlobeDot[] = []
const GLOBE_RADIUS = 300
let globeRotation = 0

class GlobeDot {
  theta: number
  phi: number
  x: number = 0
  y: number = 0
  z: number = 0
  constructor() {
    this.theta = Math.random() * 2 * Math.PI
    this.phi = Math.acos((Math.random() * 2) - 1)
  }
  update() {
     this.x = GLOBE_RADIUS * Math.sin(this.phi) * Math.cos(this.theta)
     this.y = GLOBE_RADIUS * Math.sin(this.phi) * Math.sin(this.theta)
     this.z = GLOBE_RADIUS * Math.cos(this.phi)
  }
  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
     const cosRy = Math.cos(globeRotation)
     const sinRy = Math.sin(globeRotation)
     const rx = this.x * cosRy + this.z * sinRy
     const ry = this.y
     const rz = -this.x * sinRy + this.z * cosRy
     const per = 400 / (400 + rz + GLOBE_RADIUS * 1.5)
     const px = width/2 + rx * per
     const py = height + ry * per - 100 // Shift down
     if (rz < 0) {
        ctx.beginPath()
        ctx.arc(px, py, 1.5 * per, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100, 150, 255, ${0.5 + per * 0.5})`
        ctx.fill()
     }
  }
}

const initGlobe = () => {
  globeDots.length = 0
  for(let i=0; i<1000; i++) globeDots.push(new GlobeDot())
}

const animateGlobe = () => {
  if(!globeCanvas.value) return
  const ctx = globeCanvas.value.getContext('2d')
  if(!ctx) return
  ctx.clearRect(0,0,globeCanvas.value.width, globeCanvas.value.height)
  globeRotation += 0.001
  globeDots.forEach(d => {
    d.update()
    d.draw(ctx, globeCanvas.value!.width, globeCanvas.value!.height)
  })
  requestAnimationFrame(animateGlobe)
}


onMounted(() => {
  if (starCanvas.value) {
    ctx = starCanvas.value.getContext('2d')
    handleResize()
    animateStars()
    window.addEventListener('resize', handleResize)
  }
  if (globeCanvas.value) {
    // Set size
    const parent = globeCanvas.value.parentElement
    if(parent) {
      globeCanvas.value.width = parent.clientWidth
      globeCanvas.value.height = parent.clientHeight
    }
    initGlobe()
    animateGlobe()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
})

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: 'Please enter username', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter password', trigger: 'blur' }
  ]
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        loading.value = false
        localStorage.setItem('isAuthenticated', 'true')
        ElMessage.success('Login Successful')
        router.push('/')
      }, 1000)
    }
  })
}
</script>

<style scoped>
.split-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* --- Left Panel --- */
.left-panel {
  width: 50%;
  background-color: #020617; /* Deep Space Black */
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
}

.star-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Globe Container */
.globe-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  z-index: 2;
  pointer-events: none;
}
.globe-container canvas { width: 100%; height: 100%; }

/* Atmospheric Earth Horizon */
.earth-horizon {
  position: absolute;
  bottom: -40%;
  left: 50%;
  transform: translateX(-50%);
  width: 150%;
  height: 80%;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 100%, #1e40af 0%, #172554 40%, #020617 80%);
  z-index: 2;
  box-shadow: 0 -20px 100px rgba(59, 130, 246, 0.3), inset 0 20px 60px rgba(56, 189, 248, 0.4); 
}

.brand-content { position: relative; z-index: 5; }
.brand-title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.brand-subtitle { font-size: 18px; color: #94a3b8; margin-bottom: 60px; letter-spacing: 1px; }

.feature-list { display: flex; flex-direction: column; gap: 20px; }
.feature-item { display: flex; align-items: center; gap: 15px; color: #e2e8f0; font-size: 14px; }
.feature-item .icon { color: #f97316; }


/* --- Right Panel --- */
.right-panel {
  width: 50%;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  /* Subtle Background Pattern */
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.login-center-wrapper {
  position: relative;
  width: 100%;
  max-width: 1000px;
  height: 1000px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* --- Floating Orbit Nodes --- */
.orbit-container {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}

.orbit-connections {
  position: absolute;
  width: 100%; height: 100%;
  top: 0; left: 0;
  z-index: 0;
}
.orbit-path-ring {
  fill: none;
  stroke: #cbd5e1;
  stroke-width: 1.5;
  stroke-dasharray: 8 8;
  opacity: 0.5;
}

.orbit-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 110px; /* Increased size */
  height: 110px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08); /* Stronger shadow */
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  pointer-events: auto;
  z-index: 1;
  border: 4px solid #fff; /* Border to pop from bg */
}

.orbit-node:hover {
  transform: scale(1.15) translateY(-5px);
  box-shadow: 0 15px 40px rgba(59, 130, 246, 0.2);
  border-color: #f8fafc;
}

.node-icon {
  width: 42px; /* Increased icon */
  height: 42px;
  color: #64748b;
  margin-bottom: 6px;
  transition: color 0.3s;
}

.node-label {
  font-size: 14px; /* Larger Text */
  font-weight: 700;
  color: #475569;
}

/* Colors on hover or active */
.orbit-node.blue:hover .node-icon { color: #3b82f6; }
.orbit-node.purple:hover .node-icon { color: #a855f7; }
.orbit-node.orange:hover .node-icon { color: #f97316; }
.orbit-node.green:hover .node-icon { color: #22c55e; }
.orbit-node.yellow:hover .node-icon { color: #eab308; }
.orbit-node.red:hover .node-icon { color: #ef4444; }

/* Positioning (Wider Radius ~380px) */
/* Wrapper 1000x1000, Center 500,500 */
/* 
   Pos 1 (Top): 500, 120
   Pos 2 (Top Right): 830, 310
   Pos 3 (Bottom Right): 830, 690
   Pos 4 (Bottom): 500, 880
   Pos 5 (Bottom Left): 170, 690
   Pos 6 (Top Left): 170, 310
*/

.pos-1 { top: 120px; left: 50%; margin-left: -55px; animation: float 6s ease-in-out infinite; } 
.pos-2 { top: 310px; right: 170px; animation: float 6s ease-in-out infinite 1s; } 
.pos-3 { bottom: 310px; right: 170px; animation: float 6s ease-in-out infinite 2s; } 
.pos-4 { bottom: 120px; left: 50%; margin-left: -55px; animation: float 6s ease-in-out infinite 3s; }
.pos-5 { bottom: 310px; left: 170px; animation: float 6s ease-in-out infinite 4s; }
.pos-6 { top: 310px; left: 170px; animation: float 6s ease-in-out infinite 5s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}


/* --- Clean Form --- */
.login-form-container {
  width: 340px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.08); /* Clean shadow */
  backdrop-filter: blur(10px);
}

.form-title {
  text-align: center;
  color: #0f172a;
  font-size: 22px;
  margin-bottom: 30px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.minimal-input :deep(.el-input__wrapper) {
  background: #f8fafc;
  box-shadow: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  transition: all 0.2s;
}
.minimal-input :deep(.el-input__wrapper:focus-within) {
  background: #fff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.minimal-button {
  width: 100%;
  height: 50px;
  background-color: #0f172a; /* Dark button like branding */
  border: none;
  font-weight: 600;
  font-size: 16px;
  margin-top: 20px;
  border-radius: 8px;
  color: #fff;
}
.minimal-button:hover {
  background-color: #1e293b;
}

.extra-actions {
  text-align: center;
  margin-top: 20px;
}
.forgot-pwd {
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s;
}
.forgot-pwd:hover { color: #3b82f6; }
</style>
