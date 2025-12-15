<template>
  <div class="login-container">
    <!-- GIS 背景层 -->
    <div class="gis-background">
      <div class="grid-line horizontal"></div>
      <div class="grid-line vertical"></div>
      <canvas ref="globeCanvas" class="globe-canvas"></canvas>
    </div>

    <!-- GIS 装饰 UI 层 (保持不变) -->
    <div class="gis-overlay">
      <div class="coordinate-box top-left">
        <div class="label">CURRENT LOCATION</div>
        <div class="value">LAT: {{ currentLat }}° N</div>
        <div class="value">LON: {{ currentLon }}° E</div>
        <div class="radar-scan"></div>
      </div>

      <div class="compass-box top-right">
        <svg class="compass-icon" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="rgba(16, 185, 129, 0.5)" stroke-width="2" fill="none"/>
          <path d="M50 10 L60 50 L50 90 L40 50 Z" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="2"/>
          <path d="M50 10 L60 50 L50 50 L50 10 Z" fill="#10b981"/>
          <text x="50" y="8" text-anchor="middle" fill="#10b981" font-size="10">N</text>
        </svg>
      </div>

      <div class="status-box bottom-left">
        <div class="status-item">
          <span class="indicator active"></span> SYSTEM ONLINE
        </div>
        <div class="status-item">
          <span class="indicator active"></span> RADIATING CORE: ACTIVE
        </div>
      </div>

      <div class="scale-box bottom-right">
        <div class="scale-ruler">
          <div class="segment"></div>
          <div class="segment"></div>
          <div class="segment"></div>
          <div class="segment"></div>
        </div>
        <div class="scale-text">1 : 10,000</div>
      </div>
    </div>

    <!-- 登录框 -->
    <div class="login-content">
      <div class="login-box">
        <div class="box-corner corner-tl"></div>
        <div class="box-corner corner-tr"></div>
        <div class="box-corner corner-bl"></div>
        <div class="box-corner corner-br"></div>
        
        <div class="login-header">
          <div class="logo-wrapper">
            <svg class="map-logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4L4 18L32 32L60 18L32 4Z" stroke="#10b981" stroke-width="2" fill="rgba(16, 185, 129, 0.1)"/>
              <path d="M4 28L32 42L60 28" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 38L32 52L60 38" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="title-text">地理多模态智算系统</h2>
          <p class="subtitle-text">SPATIAL INTELLIGENCE PLATFORM</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="ACCESS ID"
              :prefix-icon="User"
              size="large"
              class="custom-input"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="SECURE KEY"
              :prefix-icon="Lock"
              show-password
              size="large"
              class="custom-input"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe" class="custom-checkbox">记住凭证</el-checkbox>
            <span class="forgot-pwd">重置密钥?</span>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              size="large"
              @click="handleLogin"
            >
              <span class="btn-text">INITIALIZE SESSION</span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)
const globeCanvas = ref<HTMLCanvasElement | null>(null)

const currentLat = ref('39.9042')
const currentLon = ref('116.4074')
let coordInterval: any

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入账户ID', trigger: 'blur' },
    { min: 3, max: 20, message: '长度异常', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入安全密钥', trigger: 'blur' },
    { min: 6, message: '密钥长度不足', trigger: 'blur' }
  ]
})

// --- Enhanced Globe Animation Logic ---
let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number
const dots: Dot[] = []
const rays: Ray[] = []
const GLOBE_RADIUS = 350 // 大幅增加半径
const DOT_COUNT = 1200
const RAY_COUNT = 100 // 放射线数量
let rotation = 0

class Dot {
  theta: number
  phi: number
  x: number = 0
  y: number = 0
  z: number = 0
  
  constructor() {
    this.theta = Math.random() * 2 * Math.PI
    this.phi = Math.acos((Math.random() * 2) - 1)
  }

  update(r: number) {
    this.x = r * Math.sin(this.phi) * Math.cos(this.theta)
    this.y = r * Math.sin(this.phi) * Math.sin(this.theta)
    this.z = r * Math.cos(this.phi)
  }

  project(width: number, height: number, rotationY: number, perspectiveBase: number) {
    const cosRy = Math.cos(rotationY)
    const sinRy = Math.sin(rotationY)
    
    const rx = this.x * cosRy + this.z * sinRy
    const ry = this.y
    const rz = -this.x * sinRy + this.z * cosRy

    const perspective = perspectiveBase / (perspectiveBase + rz)
    
    return {
      x: width / 2 + rx * perspective,
      y: height / 2 + ry * perspective,
      scale: perspective,
      visible: rz < 0,
      alpha: (rz + GLOBE_RADIUS) / (2 * GLOBE_RADIUS) // Depth based alpha
    }
  }
}

class Ray {
  theta: number
  phi: number
  radius: number
  speed: number
  length: number
  
  constructor() {
    this.theta = Math.random() * 2 * Math.PI
    this.phi = Math.acos((Math.random() * 2) - 1)
    this.radius = GLOBE_RADIUS
    this.speed = 0.5 + Math.random() * 1.5
    this.length = 10 + Math.random() * 40
  }

  update() {
    this.radius += this.speed
    if (this.radius > GLOBE_RADIUS * 1.8) {
      this.radius = GLOBE_RADIUS
      this.theta = Math.random() * 2 * Math.PI
      this.phi = Math.acos((Math.random() * 2) - 1)
    }
  }

  project(width: number, height: number, rotationY: number, perspectiveBase: number) {
    const cosRy = Math.cos(rotationY)
    const sinRy = Math.sin(rotationY)

    // Head of the ray
    const hx = this.radius * Math.sin(this.phi) * Math.cos(this.theta)
    const hy = this.radius * Math.sin(this.phi) * Math.sin(this.theta)
    const hz = this.radius * Math.cos(this.phi)
    
    const rx = hx * cosRy + hz * sinRy
    const ry = hy
    const rz = -hx * sinRy + hz * cosRy
    
    const p1 = perspectiveBase / (perspectiveBase + rz)
    
    const x1 = width / 2 + rx * p1
    const y1 = height / 2 + ry * p1
    
    return {
      x: x1,
      y: y1,
      visible: rz < 0,
      opacity: 1 - (this.radius - GLOBE_RADIUS) / (GLOBE_RADIUS * 0.8)
    }
  }
}

const initGlobe = () => {
  dots.length = 0
  rays.length = 0
  for (let i = 0; i < DOT_COUNT; i++) dots.push(new Dot())
  for (let i = 0; i < RAY_COUNT; i++) rays.push(new Ray())
}

const animateGlobe = () => {
  if (!globeCanvas.value || !ctx) return
  const width = globeCanvas.value.width
  const height = globeCanvas.value.height
  const perspectiveBase = 500 // Increased perspective base for larger globe
  
  ctx.clearRect(0, 0, width, height)
  
  // Create a radial gradient for the "Core" glow
  const gradient = ctx.createRadialGradient(width/2, height/2, GLOBE_RADIUS * 0.2, width/2, height/2, GLOBE_RADIUS * 1.2)
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  rotation += 0.0015
  
  // Update Coordinates simulation
  if (Math.random() > 0.8) {
    currentLat.value = (39.9042 + Math.sin(rotation * 20)).toFixed(4)
    currentLon.value = (116.4074 + Math.cos(rotation * 20)).toFixed(4)
  }

  // Draw Dots
  dots.forEach(dot => {
    dot.update(GLOBE_RADIUS)
    const p = dot.project(width, height, rotation, perspectiveBase)
    if (p.visible) {
      ctx!.beginPath()
      ctx!.arc(p.x, p.y, 1.5 * p.scale, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(16, 185, 129, ${0.4 + p.scale * 0.6})`
      ctx!.fill()
    }
  })

  // Draw Rays (Radiation Effect)
  ctx.lineWidth = 1
  rays.forEach(ray => {
    ray.update()
    const p = ray.project(width, height, rotation, perspectiveBase)
    if (p.visible && p.opacity > 0) {
      ctx!.beginPath()
      ctx!.arc(p.x, p.y, 1, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(59, 130, 246, ${p.opacity})` // Blueish rays for contrast
      ctx!.fill()
      
      // Draw faint tail
      // Simply drawing a dot for now as rays moving out looks like particles
    }
  })

  // Connect close dots for "Network" feel (Limited to save performance on large dot count)
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)'
  const projectedDots = dots
    .map(d => d.project(width, height, rotation, perspectiveBase))
    .filter(p => p.visible)
  
  // Optimization: Only connect a subset or use a spatial grid
  // Simple optimization: check every Nth dot against others
  for (let i = 0; i < projectedDots.length; i += 2) {
      const p1 = projectedDots[i]
      // Only connect to nearby dots in the list (pseudo-spatial)
      // For visual effect without O(N^2)
      for (let j = 1; j < 5; j++) {
          if (i + j >= projectedDots.length) break
          const p2 = projectedDots[i+j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          if (dx*dx + dy*dy < 2000) {
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
          }
      }
  }
  
  animationFrameId = requestAnimationFrame(animateGlobe)
}

const handleResize = () => {
  if (!globeCanvas.value) return
  globeCanvas.value.width = window.innerWidth
  globeCanvas.value.height = window.innerHeight
}

onMounted(() => {
  if (globeCanvas.value) {
    ctx = globeCanvas.value.getContext('2d')
    handleResize()
    initGlobe()
    animateGlobe()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate((valid, fields) => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        loading.value = false
        localStorage.setItem('isAuthenticated', 'true')
        ElMessage.success({
          message: 'ACCESS GRANTED: WELCOME BACK.',
          type: 'success',
          duration: 2000
        })
        router.push('/')
      }, 1500)
    } else {
      console.log('error submit!', fields)
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #05080f;
  position: relative;
  overflow: hidden;
  font-family: 'JetBrains Mono', 'Segoe UI', monospace;
}

/* --- GIS Background --- */
.gis-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, #0f172a 0%, #000000 100%);
  z-index: 1;
}

.globe-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* --- GIS UI Overlay (HUD) --- */
.gis-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
  padding: 40px;
  box-sizing: border-box;
}

.coordinate-box, .compass-box, .status-box, .scale-box {
  position: absolute;
  color: #10b981;
  text-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
}

.top-left { top: 40px; left: 40px; }
.top-right { top: 40px; right: 40px; }
.bottom-left { bottom: 40px; left: 40px; }
.bottom-right { bottom: 40px; right: 40px; }

/* Coordinates */
.coordinate-box .label { font-size: 10px; opacity: 0.7; letter-spacing: 2px; margin-bottom: 5px; }
.coordinate-box .value { font-size: 14px; font-weight: bold; font-family: 'Courier New', monospace; }
.radar-scan {
  width: 100px; height: 2px;
  background: linear-gradient(90deg, transparent, #10b981, transparent);
  margin-top: 10px;
  animation: scan 2s linear infinite;
}
@keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

/* Compass */
.compass-icon { width: 80px; height: 80px; animation: pulseCompass 4s ease-in-out infinite; }
@keyframes pulseCompass { 0%, 100% { opacity: 0.8; transform: rotate(0deg); } 50% { opacity: 1; transform: rotate(5deg); } }

/* Status */
.status-item { font-size: 12px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
.indicator { width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block; }
.indicator.active { box-shadow: 0 0 8px #10b981; animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

/* Scale */
.scale-ruler { display: flex; width: 150px; height: 10px; border: 1px solid #10b981; border-top: none; }
.scale-ruler .segment { flex: 1; border-right: 1px solid #10b981; height: 5px; margin-top: 5px; }
.scale-ruler .segment:last-child { border-right: none; }
.scale-ruler .segment:nth-child(even) { background: rgba(16, 185, 129, 0.2); }
.scale-text { font-size: 10px; text-align: center; margin-top: 5px; letter-spacing: 1px; }

/* --- Login Box --- */
.login-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
}

.login-box {
  background: rgba(5, 8, 15, 0.75); /* 更透明，让背景球可见 */
  backdrop-filter: blur(8px);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 40px;
  position: relative;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
}

/* Tech Corners */
.box-corner {
  position: absolute;
  width: 10px; height: 10px;
  border: 2px solid #10b981;
  transition: all 0.3s;
}
.corner-tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.corner-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.corner-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.corner-br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.login-box:hover .box-corner { width: 20px; height: 20px; box-shadow: 0 0 10px #10b981; }

.login-header { text-align: center; margin-bottom: 30px; }
.map-logo { width: 60px; height: 60px; margin-bottom: 15px; animation: floatLogo 3s ease-in-out infinite; }
@keyframes floatLogo { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

.title-text { color: #fff; font-size: 20px; letter-spacing: 2px; margin: 0 0 5px; font-weight: 700; }
.subtitle-text { color: #10b981; font-size: 10px; letter-spacing: 3px; }

/* Inputs */
.custom-input :deep(.el-input__wrapper) {
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  box-shadow: none !important;
  border-radius: 0;
}
.custom-input :deep(.el-input__wrapper:hover), .custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
.custom-input :deep(.el-input__inner) { color: #fff; font-family: 'Courier New', monospace; }
.custom-input :deep(.el-input__icon) { color: #10b981; }

.form-options { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; font-size: 12px; }
.custom-checkbox { color: #6b7280; --el-checkbox-checked-text-color: #10b981; --el-checkbox-checked-bg-color: #10b981; --el-checkbox-checked-input-border-color: #10b981; }
.forgot-pwd { color: #6b7280; cursor: pointer; }
.forgot-pwd:hover { color: #10b981; }

.login-button {
  width: 100%; height: 45px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid #10b981;
  color: #10b981;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  letter-spacing: 1px;
  transition: all 0.3s;
  border-radius: 0;
}
.login-button:hover {
  background: #10b981;
  color: #000;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}
</style>
