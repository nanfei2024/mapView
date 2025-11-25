<template>
  <div class="qa-container">
    <!-- 问答历史 -->
    <div class="qa-history" ref="historyContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>智能问答助手</h3>
        <p>您可以询问关于书籍内容、章节、图表的问题</p>
        <div class="example-questions">
          <div class="example-title">试试这些问题：</div>
          <button 
            v-for="(q, i) in exampleQuestions" 
            :key="i" 
            @click="askQuestion(q)"
            class="example-btn"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <div v-else class="messages">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message', msg.type]"
        >
          <div class="message-avatar">
            <span v-if="msg.type === 'user'">👤</span>
            <span v-else>🤖</span>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="msg.content"></div>
            <div v-if="msg.nodes && msg.nodes.length > 0" class="related-nodes">
              <div class="nodes-title">📍 相关节点：</div>
              <button 
                v-for="node in msg.nodes" 
                :key="node.id"
                @click="jumpToNode(node)"
                class="node-chip"
              >
                <span class="node-icon">{{ getNodeIcon(node.category) }}</span>
                <span>{{ node.name }}</span>
              </button>
            </div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>

        <!-- AI 思考中 -->
        <div v-if="isThinking" class="message bot thinking">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="thinking-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="qa-input-area">
      <div class="input-wrapper">
        <textarea
          v-model="inputText"
          @keydown.enter.prevent="handleEnter"
          placeholder="输入您的问题..."
          class="qa-input"
          rows="1"
          ref="inputElement"
        ></textarea>
        <button 
          @click="sendMessage" 
          :disabled="!inputText.trim() || isThinking"
          class="send-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div class="input-footer">
        <label class="ai-toggle">
          <input type="checkbox" v-model="useAI">
          <span>🤖 使用 AI 增强</span>
        </label>
        <button @click="clearHistory" class="clear-btn">🗑️ 清空历史</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';

interface GraphNode {
  id: string;
  name: string;
  category: string;
  level: number;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  time: string;
  nodes?: GraphNode[];
}

const props = defineProps<{
  graphData: GraphNode[];
}>();

const emit = defineEmits<{
  (e: 'jumpToNode', nodeId: string): void;
}>();

const messages = ref<Message[]>([]);
const inputText = ref('');
const isThinking = ref(false);
const useAI = ref(false);
const historyContainer = ref<HTMLElement | null>(null);
const inputElement = ref<HTMLTextAreaElement | null>(null);

const exampleQuestions = [
  '板块构造与地貌形迹这本书讲了什么？',
  '有哪些关于劳亚区系的内容？',
  '这些书籍有哪些图表？',
  '什么是特提斯陆间带？'
];

// 获取节点图标
const getNodeIcon = (category: string): string => {
  const icons: Record<string, string> = {
    '书籍': '📚',
    '目录': '📑',
    '图表': '📊',
    '引文': '📝',
    '章节': '📖',
    '图片': '🖼️',
    '表格': '📋',
    '引用': '🔖'
  };
  return icons[category] || '📌';
};

// 发送消息
const sendMessage = async () => {
  if (!inputText.value.trim() || isThinking.value) return;

  const question = inputText.value.trim();
  
  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: question,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  });

  inputText.value = '';
  scrollToBottom();

  // 显示思考状态
  isThinking.value = true;

  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 800));

  // 处理问题
  const answer = useAI.value ? await getAIAnswer(question) : getLocalAnswer(question);
  
  messages.value.push(answer);
  isThinking.value = false;
  scrollToBottom();
};

// 本地问答（基于规则）
const getLocalAnswer = (question: string): Message => {
  const q = question.toLowerCase();
  let content = '';
  let nodes: GraphNode[] = [];

  // 搜索相关节点
  const searchNodes = (keyword: string): GraphNode[] => {
    return props.graphData.filter(node => 
      node.name.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // 书籍相关问题
  if (q.includes('板块构造') || q.includes('地貌形迹')) {
    content = '<strong>《板块构造与地貌形迹》</strong><br/>这本书详细阐述了板块构造理论与地貌形成的关系，重点研究劳亚区系、冈瓦纳区系和特提斯陆间带的地质特征及其演化过程。';
    nodes = searchNodes('板块构造');
  } else if (q.includes('亚洲地貌') || q.includes('造貌构造')) {
    content = '<strong>《亚洲地貌圈及其板块造貌构造纲要》</strong><br/>本书研究亚洲地貌圈的板块构造特征，包括喜马拉雅造山带和青藏高原隆升等内容。';
    nodes = searchNodes('亚洲');
  } else if (q.includes('地学新两论')) {
    content = '<strong>《地学新两论》</strong><br/>本书探讨板块造貌构造学的新发展，介绍现代板块构造理论和地学研究方法。';
    nodes = searchNodes('地学');
  }
  // 章节相关
  else if (q.includes('劳亚') || q.includes('laurasia')) {
    content = '劳亚区系是古生代晚期至中生代早期存在的一个超大陆的北部部分，包括现今的北美洲、欧洲和亚洲的大部分地区。相关内容在《板块构造与地貌形迹》第一章中有详细介绍。';
    nodes = searchNodes('劳亚');
  } else if (q.includes('冈瓦纳') || q.includes('gondwana')) {
    content = '冈瓦纳区系是泛大陆南部的主要组成部分，包括现今的南美洲、非洲、印度、澳大利亚和南极洲。详见《板块构造与地貌形迹》第二章。';
    nodes = searchNodes('冈瓦纳');
  } else if (q.includes('特提斯')) {
    content = '特提斯陆间带是位于劳亚大陆和冈瓦纳大陆之间的古海洋区域，在地球历史上扮演了重要角色。相关内容在《板块构造与地貌形迹》第三章。';
    nodes = searchNodes('特提斯');
  }
  // 图表相关
  else if (q.includes('图表') || q.includes('图片') || q.includes('表格')) {
    content = '知识图谱中包含多个图表资源，包括板块分布图、地貌演化图、地质年代表等。您可以点击下方的图表节点查看详情。';
    nodes = props.graphData.filter(node => 
      node.category === '图表' || node.category === '图片' || node.category === '表格'
    );
  }
  // 引文相关
  else if (q.includes('引文') || q.includes('参考文献') || q.includes('引用')) {
    content = '知识图谱中包含了重要的参考文献，如威尔逊旋回理论、板块构造学说、大陆漂移假说等经典理论。';
    nodes = props.graphData.filter(node => 
      node.category === '引文' || node.category === '引用'
    );
  }
  // 通用搜索
  else if (q.includes('有哪些') || q.includes('包含') || q.includes('内容')) {
    const keywords = ['章节', '图表', '引文', '目录'];
    const found = keywords.find(k => q.includes(k));
    if (found) {
      nodes = props.graphData.filter(node => node.category === found);
      content = `找到 ${nodes.length} 个相关的${found}节点，您可以点击下方节点在图谱中查看。`;
    } else {
      content = '知识图谱包含3本地质科学书籍，涵盖板块构造、地貌形成、亚洲地貌圈等主题。每本书都有详细的目录、图表和参考文献。';
      nodes = props.graphData.filter(node => node.category === '书籍');
    }
  }
  // 默认回答
  else {
    content = '抱歉，我没有找到相关信息。您可以尝试询问：<br/>• 书籍的主要内容<br/>• 特定章节的信息<br/>• 图表和参考文献<br/>• 地质学相关概念';
    
    // 尝试模糊搜索
    const words = question.split(/\s+/);
    for (const word of words) {
      if (word.length >= 2) {
        const found = searchNodes(word);
        if (found.length > 0) {
          nodes = found.slice(0, 5);
          content = `找到 ${found.length} 个可能相关的节点：`;
          break;
        }
      }
    }
  }

  return {
    type: 'bot',
    content,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    nodes: nodes.slice(0, 5) // 最多显示5个节点
  };
};

// AI 问答（预留接口）
const getAIAnswer = async (question: string): Promise<Message> => {
  // TODO: 接入 AI API
  // 示例：调用 OpenAI、Claude 或本地 LLM
  
  try {
    // 模拟 AI 调用
    // const response = await fetch('/api/ai/chat', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ question, context: props.graphData })
    // });
    // const data = await response.json();
    
    // 暂时使用增强的本地回答
    const localAnswer = getLocalAnswer(question);
    
    return {
      ...localAnswer,
      content: `<div class="ai-badge">🤖 AI 增强回答</div>${localAnswer.content}<br/><br/><em>提示：AI 功能即将上线，敬请期待！</em>`
    };
  } catch (error) {
    return {
      type: 'bot',
      content: '抱歉，AI 服务暂时不可用，已切换到本地问答模式。',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
  }
};

// 快速提问
const askQuestion = (question: string) => {
  inputText.value = question;
  sendMessage();
};

// 跳转到节点
const jumpToNode = (node: GraphNode) => {
  emit('jumpToNode', node.id);
  
  // 添加反馈消息
  messages.value.push({
    type: 'bot',
    content: `✅ 已为您定位到「${node.name}」节点`,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  });
  scrollToBottom();
};

// 清空历史
const clearHistory = () => {
  if (confirm('确定要清空所有对话历史吗？')) {
    messages.value = [];
  }
};

// 处理回车
const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) {
    // Shift + Enter 换行
    return;
  }
  sendMessage();
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (historyContainer.value) {
      historyContainer.value.scrollTop = historyContainer.value.scrollHeight;
    }
  });
};

// 监听消息变化，自动滚动
watch(() => messages.value.length, () => {
  scrollToBottom();
});
</script>

<style scoped>
.qa-container {
  display: flex;
  flex-direction: column;
  height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  overflow: hidden;
}

.qa-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #2d3748;
}

.empty-state p {
  margin: 0 0 30px 0;
  color: #718096;
  font-size: 14px;
}

.example-questions {
  max-width: 500px;
  margin: 0 auto;
}

.example-title {
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 12px;
  font-weight: 500;
}

.example-btn {
  display: block;
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #2d3748;
  transition: all 0.2s;
}

.example-btn:hover {
  border-color: #667eea;
  background: #f7fafc;
  transform: translateX(4px);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message.bot .message-avatar {
  background: linear-gradient(135deg, #48bb78 0%, #38b2ac 100%);
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 12px 12px 4px 12px;
}

.message.bot .message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 12px 12px 12px 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.ai-badge {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 4px;
  font-size: 11px;
  margin-bottom: 8px;
  font-weight: 500;
}

.related-nodes {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.nodes-title {
  font-size: 12px;
  color: #4a5568;
  margin-bottom: 8px;
  font-weight: 500;
}

.node-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  margin: 4px 4px 4px 0;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-chip:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
}

.node-icon {
  font-size: 14px;
}

.message-time {
  font-size: 11px;
  color: #a0aec0;
  margin-top: 4px;
}

.message.user .message-time {
  color: rgba(255,255,255,0.7);
}

.thinking {
  opacity: 0.8;
}

.thinking-dots {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: #cbd5e0;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.thinking-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.qa-input-area {
  border-top: 1px solid #e2e8f0;
  background: white;
  padding: 16px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.qa-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  transition: border-color 0.2s;
}

.qa-input:focus {
  outline: none;
  border-color: #667eea;
}

.send-btn {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102,126,234,0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f7fafc;
}

.ai-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4a5568;
  cursor: pointer;
}

.ai-toggle input {
  cursor: pointer;
}

.clear-btn {
  background: none;
  border: none;
  color: #718096;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #f7fafc;
  color: #e53e3e;
}

.qa-history::-webkit-scrollbar {
  width: 6px;
}

.qa-history::-webkit-scrollbar-track {
  background: #f7fafc;
}

.qa-history::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.qa-history::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
