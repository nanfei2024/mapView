<template>
  <div class="citation-viewer">
    <!-- 引文目录列表 -->
    <div class="citation-catalog">
      <div class="catalog-header">
        <h4>引文目录</h4>
        <span class="citation-count">{{ citations.length }} 条</span>
      </div>
      
      <div v-if="loading" class="loading-indicator">
        <p>正在加载引文...</p>
      </div>
      
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="loadCitations" class="retry-btn">重试</button>
      </div>
      
      <div v-else-if="citations.length === 0" class="no-citations">
        <p>该章节暂无参考文献</p>
      </div>
      
      <ul v-else class="citation-list">
        <li 
          v-for="citation in citations" 
          :key="citation.id"
          :class="{ 'active': selectedCitation?.id === citation.id }"
          @click="selectCitation(citation)"
        >
          <span class="citation-number">
            <template v-if="citation.author">📚</template>
            <template v-else>[{{ citation.number }}]</template>
          </span>
          <span class="citation-text">
            <template v-if="citation.author">
              <strong>{{ citation.author }}</strong> ({{ citation.year }})
            </template>
            <template v-else>{{ citation.text }}</template>
          </span>
        </li>
      </ul>
    </div>
    
    <!-- 引文详情和上下文 -->
    <div class="citation-detail" v-if="selectedCitation">
      <div class="detail-header">
        <h4>引文详情</h4>
        <button @click="clearSelection" class="close-btn">×</button>
      </div>
      
      <div class="citation-info">
        <div class="citation-full">
          <span class="label">完整引文：</span>
          <p>[{{ selectedCitation.number }}] {{ selectedCitation.text }}</p>
        </div>
      </div>
      
      <!-- 引用位置列表 -->
      <div class="citation-references" v-if="citationReferences.length > 0">
        <h5>正文引用位置 ({{ citationReferences.length }}处)</h5>
        <div class="reference-list">
          <div 
            v-for="(ref, index) in citationReferences" 
            :key="index"
            class="reference-item"
            @click="scrollToReference(index)"
          >
            <div class="reference-section" v-if="ref.sectionTitle">
              <span class="section-icon">📍</span>
              {{ ref.sectionTitle }}
            </div>
            <div class="reference-context">
              {{ ref.context }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-references">
        <p>正文中未找到此引文的引用</p>
      </div>
    </div>
    
    <div v-else class="citation-placeholder">
      <p>👆 请选择一条引文查看详情</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import axios from 'axios';

// 定义引文接口
interface Citation {
  id: string;
  number: number;
  text: string;
  rawText: string;
  author?: string;   // 作者名（用于新格式）
  year?: string;     // 年份（用于新格式）
}

interface CitationReference {
  sectionTitle?: string;
  context: string;
  position: number;
  sentenceIndex: number;
}

// Props
const props = defineProps<{
  fileId?: number;
  chapterNumber?: string;
  bookId?: number;
}>();

// Emits
const emit = defineEmits<{
  (e: 'citationSelected', citation: Citation): void;
  (e: 'referenceClicked', reference: CitationReference): void;
}>();

// 状态
const loading = ref(false);
const error = ref('');
const citations = ref<Citation[]>([]);
const selectedCitation = ref<Citation | null>(null);
const citationReferences = ref<CitationReference[]>([]);
const markdownContent = ref('');

// 加载引文
const loadCitations = async () => {
  if (!props.fileId) {
    citations.value = [];
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    // 获取章节内容
    const url = `http://localhost:8080/api/files/markdown/${props.fileId}/content`;
    const response = await axios.get(url);
    
    const content = response.data?.content || '';
    markdownContent.value = content;
    
    // 提取参考文献
    citations.value = extractCitations(content);
    
    console.log(`成功提取 ${citations.value.length} 条引文`);
  } catch (err: any) {
    console.error('加载引文失败:', err);
    error.value = err.response?.data?.error || '加载引文失败';
  } finally {
    loading.value = false;
  }
};

// 从Markdown内容中提取引文
const extractCitations = (content: string): Citation[] => {
  const lines = content.split('\n');
  const citationList: Citation[] = [];
  let inReferenceSection = false;
  let citationIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测参考文献章节开始（支持更多变体）
    if (/^##?\s*(参考文献|REFERENCES?|引用文献|文献|第.+章参考文献)/i.test(line)) {
      inReferenceSection = true;
      continue;
    }
    
    // 检测下一个章节开始（参考文献结束）
    if (inReferenceSection && /^##?\s+/.test(line) && !/^##?\s*(参考文献|REFERENCES?)/i.test(line)) {
      break;
    }
    
    // 提取引文条目
    if (inReferenceSection && line.length > 0) {
      // 格式1：[1] 引文内容（传统格式）
      const numberedMatch = line.match(/^\[(\d+)\]\s+(.+)$/);
      if (numberedMatch) {
        const number = parseInt(numberedMatch[1]);
        const text = numberedMatch[2];
        
        citationList.push({
          id: `citation-${number}`,
          number: number,
          text: text,
          rawText: line
        });
        continue;
      }
      
      // 格式2：作者，年份，其他信息（新格式）
      // 匹配：作者名(可能包含英文),年份(4位数字),其余内容
      const authorYearMatch = line.match(/^([^,，]+)[,，]\s*(\d{4})[,，\s]/);
      if (authorYearMatch) {
        const author = authorYearMatch[1].trim();
        const year = authorYearMatch[2];
        citationIndex++;
        
        citationList.push({
          id: `citation-${author}-${year}`,
          number: citationIndex,
          text: line,
          rawText: line,
          author: author,
          year: year
        } as any);
        continue;
      }
      
      // 格式3：作者 年份 其他信息（空格分隔）
      const authorYearSpaceMatch = line.match(/^([A-Za-z\.\s]+)[,，]\s*(\d{4})[,，]/);
      if (authorYearSpaceMatch) {
        const author = authorYearSpaceMatch[1].trim();
        const year = authorYearSpaceMatch[2];
        citationIndex++;
        
        citationList.push({
          id: `citation-${author}-${year}`,
          number: citationIndex,
          text: line,
          rawText: line,
          author: author,
          year: year
        } as any);
      }
    }
  }
  
  return citationList;
};

// 选择引文
const selectCitation = (citation: Citation) => {
  selectedCitation.value = citation;
  
  // 在正文中查找引用位置
  findCitationReferences(citation);
  
  // 触发事件
  emit('citationSelected', citation);
};

// 清除选择
const clearSelection = () => {
  selectedCitation.value = null;
  citationReferences.value = [];
};

// 在正文中查找引文引用位置
const findCitationReferences = (citation: Citation) => {
  if (!markdownContent.value) {
    citationReferences.value = [];
    return;
  }
  
  const references: CitationReference[] = [];
  const lines = markdownContent.value.split('\n');
  const citAny = citation as any;
  
  // 构建搜索模式
  let searchPatterns: RegExp[] = [];
  
  // 如果是传统[数字]格式
  if (citation.number && !citAny.author) {
    searchPatterns.push(new RegExp(`\\[${citation.number}\\]`, 'g'));
  }
  
  // 如果是作者-年份格式
  if (citAny.author && citAny.year) {
    // 匹配: 作者(年份) 或 (作者,年份) 或 作者，年份
    const author = citAny.author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const year = citAny.year;
    searchPatterns.push(
      new RegExp(`${author}\\s*\\(\\s*${year}`, 'gi'),
      new RegExp(`\\(\\s*${author}\\s*,\\s*${year}`, 'gi'),
      new RegExp(`${author}\\s*,\\s*${year}`, 'gi'),
      new RegExp(`${author}\\s*${year}`, 'gi')
    );
  }
  
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 更新当前小节标题
    const sectionMatch = line.match(/^#{1,6}\s+(.+)/);
    if (sectionMatch && !sectionMatch[1].includes('参考文献')) {
      currentSection = sectionMatch[1].trim();
    }
    
    // 查找引用
    let foundMatch = false;
    for (const pattern of searchPatterns) {
      if (pattern.test(line)) {
        foundMatch = true;
        pattern.lastIndex = 0; // 重置
        break;
      }
    }
    
    if (foundMatch) {
      // 提取上下文（当前句子）
      const sentences = line.split(/[。！？；.!?;]/);
      for (const sentence of sentences) {
        let matchesInSentence = false;
        for (const pattern of searchPatterns) {
          if (pattern.test(sentence)) {
            matchesInSentence = true;
            pattern.lastIndex = 0;
            break;
          }
        }
        
        if (matchesInSentence) {
          references.push({
            sectionTitle: currentSection,
            context: sentence.trim(),
            position: i,
            sentenceIndex: references.length
          });
        }
      }
    }
  }
  
  citationReferences.value = references;
  console.log(`找到 ${references.length} 处引用`);
};

// 滚动到引用位置
const scrollToReference = (index: number) => {
  const ref = citationReferences.value[index];
  emit('referenceClicked', ref);
};

// 监听 fileId 变化，自动加载引文
watch(() => props.fileId, (newFileId) => {
  if (newFileId) {
    loadCitations();
  } else {
    citations.value = [];
    selectedCitation.value = null;
  }
}, { immediate: true });

// 暴露方法供父组件调用
defineExpose({
  loadCitations,
  clearSelection
});
</script>

<style scoped>
.citation-viewer {
  display: flex;
  gap: 20px;
  height: 100%;
  min-height: 0;
}

/* 左侧目录区 */
.citation-catalog {
  flex: 0 0 45%;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.catalog-header h4 {
  margin: 0;
  font-size: 16px;
}

.citation-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.citation-list {
  list-style: none;
  padding: 8px;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.citation-list li {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.citation-list li:hover {
  border-left-color: #667eea;
  background: #f0f4ff;
  transform: translateX(2px);
}

.citation-list li.active {
  border-left-color: #667eea;
  background: #e0e7ff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.citation-number {
  flex-shrink: 0;
  font-weight: 600;
  color: #667eea;
  font-size: 14px;
}

.citation-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 右侧详情区 */
.citation-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.detail-header h4 {
  margin: 0;
  font-size: 16px;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.citation-info {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.citation-full {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-weight: 600;
  color: #667eea;
  font-size: 14px;
}

.citation-full p {
  margin: 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #667eea;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.citation-references {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
}

.citation-references h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.reference-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reference-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #10b981;
  cursor: pointer;
  transition: all 0.2s;
}

.reference-item:hover {
  background: #ecfdf5;
  border-left-color: #059669;
  transform: translateX(2px);
}

.reference-section {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
}

.section-icon {
  font-size: 14px;
}

.reference-context {
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
}

/* 占位符 */
.citation-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 14px;
}

.no-citations,
.no-references {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

.loading-indicator,
.error-message {
  padding: 20px;
  text-align: center;
}

.retry-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #5568d3;
}
</style>
