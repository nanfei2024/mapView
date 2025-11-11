<template>
  <div 
    class="ai-chat-box" 
    :class="{ 'is-expanded': isExpanded, 'is-dragging': isDragging }"
    :style="boxStyle"
    ref="chatBox"
  >
    <!-- 聊天框头部 -->
    <div 
      class="chat-header" 
      @mousedown="startDrag"
      @click="toggleExpand"
    >
      <div class="header-content">
        <div class="ai-avatar">
          <span class="ai-icon">🤖</span>
          <div class="status-dot"></div>
        </div>
        <div class="header-text">
          <span class="title">AI 助手</span>
          <span class="subtitle">在线为您服务</span>
        </div>
      </div>
      <span class="toggle-icon">{{ isExpanded ? '−' : '+' }}</span>
    </div>

    <!-- 聊天内容区域 -->
    <div class="chat-content" v-show="isExpanded">
      <div class="messages" ref="messageContainer">
        <div v-for="(message, index) in messages" 
             :key="index" 
             :class="['message', message.role]">
          <div class="message-wrapper">
            <div class="avatar">
              {{ message.role === 'assistant' ? '🤖' : '👤' }}
            </div>
            <div class="message-bubble">
              <div class="message-content">{{ message.content }}</div>
              <div class="message-time">{{ getCurrentTime() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷功能按钮 -->
      <div class="quick-actions">
        <button @click="quickAction('control')" title="自然语言控制">
          <div class="action-content">
            <span class="icon">🎮</span>
            <span class="text">控制</span>
          </div>
        </button>
        <button @click="quickAction('explain')" title="数据解释">
          <div class="action-content">
            <span class="icon">📊</span>
            <span class="text">解释</span>
          </div>
        </button>
        <button @click="quickAction('recommend')" title="图层推荐">
          <div class="action-content">
            <span class="icon">🗺️</span>
            <span class="text">推荐</span>
          </div>
        </button>
      </div>

      <!-- 输入框区域 -->
      <div class="input-area">
        <input
          v-model="userInput"
          @keyup.enter="sendMessage"
          placeholder="输入问题或指令..."
          type="text"
        />
        <button @click="sendMessage" class="send-button">
          <svg class="send-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';

const props = defineProps({
  map: {
    type: Object,
    required: false,
    default: null
  }
});

const isExpanded = ref(false);
const userInput = ref('');
const messages = ref([
  { role: 'assistant', content: '你好！我是AI助手，可以帮助你：\n1. 用自然语言控制地图\n2. 解释数据含义\n3. 推荐合适的图层' }
]);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 快捷操作
const quickAction = (type) => {
  switch(type) {
    case 'control':
      userInput.value = "请帮我显示所有与气候相关的图层";
      break;
    case 'explain':
      userInput.value = "请解释一下这个图层显示的数据代表什么？";
      break;
    case 'recommend':
      userInput.value = "我想研究板块构造，推荐相关图层";
      break;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userInput.value
  });

  // TODO: 这里添加实际的 AI 处理逻辑
  // 模拟 AI 响应
  const aiResponse = await processAIResponse(userInput.value);
  messages.value.push({
    role: 'assistant',
    content: aiResponse
  });

  userInput.value = '';
};

// 修改地理编码函数
const geocodeCity = async (cityName) => {
  try {
    const accessToken = 'pk.eyJ1IjoiY3VkODUiLCJhIjoiY2xrYnFncXZhMGc1cTNlbmFrNHN1N2cxeCJ9.69E3f8nMJkvqQDRhLSojVw';
    
    // 构建查询参数
    const params = new URLSearchParams({
      access_token: accessToken,
      types: 'place',  // 限制搜索结果为城市
      limit: 1,        // 返回最相关的结果
      language: 'zh'   // 优先返回中文名称
    });
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?${params}`
    );
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.center;
      
      // 获取城市的边界框来确定合适的缩放级别
      const bbox = feature.bbox;
      let zoom = 10; // 默认缩放级别
      
      if (bbox) {
        // 根据城市大小自动调整缩放级别
        const [minLng, minLat, maxLng, maxLat] = bbox;
        const width = Math.abs(maxLng - minLng);
        const height = Math.abs(maxLat - minLat);
        const size = Math.max(width, height);
        
        // 根据城市大小调整缩放级别
        if (size > 5) zoom = 6;        // 很大的城市/地区
        else if (size > 2) zoom = 8;   // 大城市
        else if (size > 1) zoom = 9;   // 中等城市
        else if (size > 0.5) zoom = 10; // 小城市
        else zoom = 12;                 // 很小的城市
      }

      // 构建更详细的位置信息
      const placeName = feature.place_name;
      const country = feature.context?.find(c => c.id.startsWith('country'))?.text || '';
      const region = feature.context?.find(c => c.id.startsWith('region'))?.text || '';
      
      return {
        coordinates: [lng, lat],
        zoom: zoom,
        placeName: placeName,
        country: country,
        region: region
      };
    }
    return null;
  } catch (error) {
    console.error('地理编码错误:', error);
    return null;
  }
};

// 修改 processAIResponse 中的定位处理部分
const processAIResponse = async (input) => {
  const lowercaseInput = input.toLowerCase();
  
  if (lowercaseInput.includes('定位') || lowercaseInput.includes('查看') || lowercaseInput.includes('前往')) {
    // 预设城市坐标（常用城市快速响应）
    const commonLocations = {
      '东京': [139.6917, 35.6895, 10],
      '纽约': [-74.0060, 40.7128, 11],
      '伦敦': [-0.1276, 51.5074, 11],
      '巴黎': [2.3522, 48.8566, 11],
      '悉尼': [151.2093, -33.8688, 11],
      '新加坡': [103.8198, 1.3521, 11]
      // 保留原有的中国城市...
    };

    const cityMatch = input.match(/[定位|查看|前往]到?(.+)/) || 
                     input.match(/去(.+)/) || 
                     input.match(/看看(.+)/);
    
    if (cityMatch) {
      // 检查 map 是否可用
      if (!props.map) {
        return '抱歉，地图尚未加载完成，请稍后再试。';
      }
      
      const cityName = cityMatch[1].replace(/市$/, '').trim();
      
      // 检查预设城市
      if (commonLocations[cityName]) {
        const [lng, lat, zoom] = commonLocations[cityName];
        props.map.flyTo({
          center: [lng, lat],
          zoom: zoom,
          essential: true
        });
        return `正在为您定位到${cityName}...`;
      }
      
      // 使用改进的地理编码服务
      const location = await geocodeCity(cityName);
      if (location) {
        props.map.flyTo({
          center: location.coordinates,
          zoom: location.zoom,
          essential: true
        });
        
        // 根据返回信息构建更详细的响应
        let response = `正在为您定位到${location.placeName}`;
        if (location.country && !location.placeName.includes(location.country)) {
          response += `（${location.country}）`;
        }
        return response;
      } else {
        return `抱歉，我找不到"${cityName}"的准确位置信息。请尝试输入更完整的城市名称。`;
      }
    }
  }

  // 处理图层控制
  if (lowercaseInput.includes('显示') || lowercaseInput.includes('打开')) {
    if (lowercaseInput.includes('气候')) {
      // 触发父组件的图层控制方法
      emit('toggleLayers', ['亚洲气候与地貌', '亚洲气候水文', '亚洲气候线', '亚洲气候多边形']);
      return '已为您显示所有气候相关图层';
    }
    if (lowercaseInput.includes('板块')) {
      emit('toggleLayers', ['主板块', '亚板块']);
      return '已为您显示板块相关图层';
    }
  }

  // 处理缩放控制
  if (lowercaseInput.includes('放大')) {
    if (!props.map) {
      return '抱歉，地图尚未加载完成，请稍后再试。';
    }
    props.map.zoomIn();
    return '正在放大地图...';
  }
  if (lowercaseInput.includes('缩小')) {
    if (!props.map) {
      return '抱歉，地图尚未加载完成，请稍后再试。';
    }
    props.map.zoomOut();
    return '正在缩小地图...';
  }

  // 其他预设响应
  const responses = {
    '请帮我显示所有与气候相关的图层': '好的，我帮你打开以下气候相关图层：\n- 亚洲气候与地貌\n- 亚洲气候水文\n- 亚洲气候线\n- 亚洲气候多边形',
    '请解释一下这个图层显示的数据代表什么？': '当前显示的是亚洲气候分布图层，不同颜色代表不同的气候类型。红色区域表示热带气候，黄色区域表示温带气候，蓝色区域表示寒带气候。',
    '我想研究板块构造，推荐相关图层': '为了研究板块构造，我建议你查看这些图层：\n1. 主板块\n2. 亚板块\n3. 全球活动构造板块及其边界带数据集\n4. 全球板块边界及其类型数据集'
  };

  return responses[input] || `我理解您想${input}，正在处理...`;
};

// 定义事件
const emit = defineEmits(['toggleLayers']);

// 使用计算属性来处理位置样式
const boxStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px)`,
  cursor: isDragging.value ? 'grabbing' : 'grab'
}));

// 优化拖拽相关的状态和函数
const position = ref({ x: 20, y: window.innerHeight - 500 });
const isDragging = ref(false);
const initialPosition = ref({ x: 0, y: 0 });
const dragStart = ref({ x: 0, y: 0 });

// 优化后的拖拽开始函数
const startDrag = (e) => {
  if (e.target.closest('.quick-actions') || e.target.closest('.input-area')) {
    return;
  }
  
  e.preventDefault();
  isDragging.value = true;
  
  // 记录初始位置
  initialPosition.value = {
    x: position.value.x,
    y: position.value.y
  };
  
  // 记录鼠标开始位置
  dragStart.value = {
    x: e.clientX,
    y: e.clientY
  };

  // 添加事件监听
  window.addEventListener('mousemove', onDrag, { passive: true });
  window.addEventListener('mouseup', stopDrag, { passive: true });
};

// 优化后的拖拽中函数
const onDrag = (e) => {
  if (!isDragging.value) return;

  // 计算位移
  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;

  // 更新位置
  position.value = {
    x: initialPosition.value.x + dx,
    y: initialPosition.value.y + dy
  };

  // 添加边界限制
  const container = document.documentElement;
  const box = chatBox.value.getBoundingClientRect();
  
  position.value.x = Math.min(
    Math.max(position.value.x, -box.width / 2),
    container.clientWidth - box.width / 2
  );
  
  position.value.y = Math.min(
    Math.max(position.value.y, 0),
    container.clientHeight - box.height
  );
};

// 优化后的停止拖拽函数
const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};

// 添加窗口大小改变时的处理
onMounted(() => {
  window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
});

const onWindowResize = () => {
  const container = document.documentElement;
  const box = chatBox.value.getBoundingClientRect();
  
  position.value = {
    x: Math.min(position.value.x, container.clientWidth - box.width),
    y: Math.min(position.value.y, container.clientHeight - box.height)
  };
};

// 添加获取当前时间的函数
const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};
</script>

<style scoped>
/* 导入 Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

.ai-chat-box {
  position: fixed;
  width: 340px;
  left: 0;
  top: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  will-change: transform;  /* 优化性能 */
  transform: translate(0, 0);  /* 使用 transform 代替 left/top */
  touch-action: none;  /* 防止触摸设备上的滚动干扰 */
  user-select: none;  /* 防止文本选择干扰拖拽 */
  transition: 
    transform 0.2s cubic-bezier(0.2, 0, 0, 1),
    border-radius 0.3s ease,
    box-shadow 0.3s ease;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 拖拽时的样式 */
.ai-chat-box.is-dragging {
  transition: none;  /* 拖拽时禁用过渡效果 */
  cursor: grabbing;
}

.ai-chat-box:not(.is-dragging) {
  transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);  /* 非拖拽时添加平滑过渡 */
}

.chat-header {
  padding: 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
  color: white;
  border-radius: 16px;
  cursor: grab;  /* 更改光标样式 */
  touch-action: none;
  transition: border-radius 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-icon {
  font-size: 24px;
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #22c55e, #10b981);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
  border-radius: 50%;
  border: 2px solid #4f46e5;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.02em;
  background: linear-gradient(to right, #fff, #e2e8f0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.02em;
}

.toggle-icon {
  font-size: 24px;
  font-weight: 300;
}

.messages {
  padding: 20px;
  max-height: 350px;
}

.message-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message.user .message-wrapper {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.message.assistant .avatar {
  background: #ede9fe;
}

.message-bubble {
  max-width: 75%;
}

.message-content {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0.01em;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  color: #334155;
  font-weight: 400;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message.user .message-content {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.message.assistant .message-content {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  color: #334155;
  font-weight: 400;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-time {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  letter-spacing: 0.02em;
  margin-top: 4px;
  text-align: right;
}

.quick-actions {
  padding: 12px 20px;
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f3f4f6;
  background: rgba(255, 255, 255, 0.8);
}

.quick-actions button {
  padding: 8px 16px;
  border-radius: 12px;
  transition: all 0.2s;
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.quick-actions .icon {
  font-size: 24px;
}

.quick-actions .text {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  background: linear-gradient(135deg, #475569, #64748b);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.input-area {
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
  border-radius: 0 0 16px 16px;
  background: white;
}

.input-area input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
  margin-bottom: 8px;
  font-family: 'Inter', sans-serif;
  color: #334155;
  letter-spacing: 0.01em;
  background: #f8fafc;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.input-area input::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

.input-area input:focus {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 
    0 0 0 3px rgba(99, 102, 241, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0);
}

.send-button {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.send-button:hover {
  background: linear-gradient(135deg, #4338ca, #4f46e5);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
}

.send-icon {
  width: 20px;
  height: 20px;
  color: white;
}

/* 自定义滚动条 */
.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: transparent;
}

.messages::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
  border-radius: 4px;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(10px) scale(0.98);
    filter: blur(4px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.message {
  animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);
}

/* 添加拖拽时的视觉反馈 */
.is-dragging .chat-header {
  background: linear-gradient(135deg, #4338ca, #6d28d9);  /* 稍微加深的渐变 */
}

/* 未展开状态时的样式 */
.ai-chat-box:not(.is-expanded) {
  border-radius: 16px;  /* 所有角都使用相同的圆角 */
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* 展开状态时的样式 */
.ai-chat-box.is-expanded {
  border-radius: 16px 16px 16px 16px;
}

/* 展开状态时头部的样式 */
.is-expanded .chat-header {
  border-radius: 16px 16px 0 0;  /* 只保留上方圆角 */
}

/* 优化阴影效果 */
.ai-chat-box:not(.is-expanded):hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.15);
}

/* 添加内容区域的圆角过渡 */
.chat-content {
  /* ... 其他样式保持不变 ... */
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}
</style> 