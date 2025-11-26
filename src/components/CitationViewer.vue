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
  position: number;  // 在markdown中的行号
  sentenceIndex: number;
  lineNumber: number;  // 具体行号（用于跳转）
  citationText: string;  // 引用标注文本（用于高亮）
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
    if (/^##?\s*(参考文献|REFERENCES?|引用文献|文献资料|第.+章参考文献)/i.test(line)) {
      inReferenceSection = true;
      console.log(`找到参考文献章节起始: 第${i+1}行`);
      continue;
    }
    
    // 优化：不在遇到新章节时停止，继续提取直到文件末尾
    // 只跳过明显的章节标题行
    if (inReferenceSection && /^##?\s+\d+[\.、\s]/.test(line)) {
      // 这是一个带数字的章节标题，可能参考文献已结束
      console.log(`检测到可能的章节标题: ${line}`);
      // 不立即break，继续检查后续内容
    }
    
    // 提取引文条目（在参考文献章节内）
    if (inReferenceSection && line.length > 0) {
      let matched = false;
      
      // 格式1：[数字] 引文内容 或 (数字) 引文内容
      const numberedMatch = line.match(/^[\[\(](\d+)[\]\)]\s*(.+)$/);
      if (numberedMatch) {
        const number = parseInt(numberedMatch[1]);
        const text = numberedMatch[2];
        
        citationList.push({
          id: `citation-${number}`,
          number: number,
          text: text,
          rawText: line
        });
        matched = true;
        console.log(`提取编号引文[${number}]: ${text.substring(0, 50)}...`);
      }
      
      // 格式2：作者，年份，内容（中文逗号）
      if (!matched) {
        const authorYearMatch = line.match(/^([^,，\d]{2,})[,，]\s*(\d{4})[,，\s]/);
        if (authorYearMatch) {
          let author = authorYearMatch[1].trim();
          const year = authorYearMatch[2];
          
          // 清理作者名：移除"等"、"et al"等后缀
          author = author.replace(/\s*(等|et\s*al\.?|and\s+others?)\.?\s*$/i, '').trim();
          
          // 如果作者名太短或只包含通用词，跳过
          if (author.length < 2 || ['等', 'et al', 'etc'].includes(author)) {
            console.log(`跳过无效作者名: ${author}`);
          } else {
            citationIndex++;
            
            citationList.push({
              id: `citation-${author}-${year}-${citationIndex}`,
              number: citationIndex,
              text: line,
              rawText: line,
              author: author,
              year: year
            } as any);
            matched = true;
            console.log(`提取作者-年份引文: ${author}(${year})`);
          }
        }
      }
      
      // 格式3：纯数字开头（如：1 作者，年份）
      if (!matched) {
        const numberStartMatch = line.match(/^(\d{1,3})[\s\.、]\s*(.+)[,，]\s*(\d{4})/);
        if (numberStartMatch) {
          const number = parseInt(numberStartMatch[1]);
          let author = numberStartMatch[2].trim();
          const year = numberStartMatch[3];
          
          // 清理作者名
          author = author.replace(/\s*(等|et\s*al\.?|and\s+others?)\.?\s*$/i, '').trim();
          
          // 只提取第一个逗号之前的内容作为作者名
          if (author.includes(',') || author.includes('，')) {
            author = author.split(/[,，]/)[0].trim();
          }
          
          if (author.length >= 2) {
            citationList.push({
              id: `citation-${number}`,
              number: number,
              text: line.substring(numberStartMatch[0].indexOf(author)),
              rawText: line,
              author: author,
              year: year
            } as any);
            matched = true;
            console.log(`提取数字开头引文[${number}]: ${author}(${year})`);
          }
        }
      }
      
      // 格式4：单独年份开头（1996,）
      if (!matched && /^\d{4}[,，]/.test(line)) {
        const yearMatch = line.match(/^(\d{4})[,，]\s*(.+)/);
        if (yearMatch) {
          const year = yearMatch[1];
          const text = yearMatch[2];
          citationIndex++;
          
          citationList.push({
            id: `citation-year-${year}-${citationIndex}`,
            number: citationIndex,
            text: line,
            rawText: line,
            year: year
          } as any);
          matched = true;
          console.log(`提取年份开头引文(${year}): ${text.substring(0, 50)}...`);
        }
      }
      
      // 格式5：包含作者和年份但格式不规则
      if (!matched && /\d{4}/.test(line)) {
        const flexibleMatch = line.match(/([^,，\d]{2,20})[,，\s]+(\d{4})/);
        if (flexibleMatch) {
          let author = flexibleMatch[1].trim();
          const year = flexibleMatch[2];
          
          // 清理作者名
          author = author.replace(/\s*(等|et\s*al\.?|and\s+others?)\.?\s*$/i, '').trim();
          
          // 只提取第一个作者（在逗号或"等"之前）
          const firstAuthorMatch = author.match(/^([^,，]+?)(?:[,，]|等|et\s*al)/);
          if (firstAuthorMatch) {
            author = firstAuthorMatch[1].trim();
          }
          
          // 验证作者名的有效性
          if (author.length >= 2 && !['等', 'et al', 'etc', '见'].includes(author)) {
            citationIndex++;
            
            citationList.push({
              id: `citation-flex-${author}-${year}-${citationIndex}`,
              number: citationIndex,
              text: line,
              rawText: line,
              author: author,
              year: year
            } as any);
            matched = true;
            console.log(`提取灵活格式引文: ${author}(${year})`);
          } else {
            console.log(`跳过无效灵活格式作者: ${author}`);
          }
        }
      }
    }
  }
  
  console.log(`总共提取 ${citationList.length} 条参考文献`);
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
  let citationText = '';
  
  // 如果是传统[数字]格式
  if (citation.number && !citAny.author) {
    searchPatterns.push(new RegExp(`\\[${citation.number}\\]`, 'g'));
    citationText = `[${citation.number}]`;
  }
  
  // 如果是作者-年份格式
  if (citAny.author && citAny.year) {
    const author = citAny.author.trim();
    const year = citAny.year;
    
    // 过滤掉太短或太常见的作者名（避免误匹配）
    if (author.length < 2 || ['等', 'et al', 'etc'].includes(author)) {
      console.warn('作者名太短或太常见，跳过引用查找:', author);
      citationReferences.value = [];
      return;
    }
    
    // 转义特殊字符
    const escapedAuthor = author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 更严格的匹配规则（必须有明确的引用格式）
    searchPatterns.push(
      // 格式1: 作者(年份) 或 作者（年份）
      new RegExp(`${escapedAuthor}\\s*[\\(（]\\s*${year}\\s*[\\)）]`, 'g'),
      // 格式2: (作者,年份) 或 （作者，年份）
      new RegExp(`[\\(（]\\s*${escapedAuthor}\\s*[,，]\\s*${year}\\s*[\\)）]`, 'g'),
      // 格式3: (作者 年份) 或 （作者 年份）
      new RegExp(`[\\(（]\\s*${escapedAuthor}\\s+${year}\\s*[\\)）]`, 'g'),
      // 格式4: [作者,年份] 或 ［作者，年份］
      new RegExp(`[\\[［]\\s*${escapedAuthor}\\s*[,，]\\s*${year}\\s*[\\]］]`, 'g')
    );
    citationText = `${author}(${year})`;
    
    console.log('作者-年份格式搜索:', author, year);
  }
  
  let currentSection = '';
  let inReferenceSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检测是否进入参考文献章节（跳过参考文献章节的搜索）
    if (/^##?\s*(参考文献|REFERENCES?|引用文献)/i.test(line)) {
      inReferenceSection = true;
    }
    
    // 更新当前小节标题
    const sectionMatch = line.match(/^#{1,6}\s+(.+)/);
    if (sectionMatch && !sectionMatch[1].includes('参考文献')) {
      currentSection = sectionMatch[1].trim();
      inReferenceSection = false;  // 新章节开始，重置参考文献标记
    }
    
    // 跳过参考文献章节
    if (inReferenceSection) {
      continue;
    }
    
    // 查找引用
    let foundMatch = false;
    let matchedText = '';
    for (const pattern of searchPatterns) {
      const match = pattern.exec(line);
      if (match) {
        foundMatch = true;
        matchedText = match[0];
        pattern.lastIndex = 0; // 重置
        break;
      }
    }
    
    if (foundMatch) {
      // 提取上下文（当前句子）
      const sentences = line.split(/[。！？；.!?;]/);
      for (let si = 0; si < sentences.length; si++) {
        const sentence = sentences[si].trim();
        if (!sentence) continue;
        
        let matchesInSentence = false;
        let sentenceMatchedText = '';
        for (const pattern of searchPatterns) {
          const match = pattern.exec(sentence);
          if (match) {
            matchesInSentence = true;
            sentenceMatchedText = match[0];
            pattern.lastIndex = 0;
            break;
          }
        }
        
        if (matchesInSentence) {
          // 额外验证：对于作者-年份格式，确保是真正的引用上下文
          let isValidReference = true;
          if (citAny.author && citAny.year) {
            // 检查是否包含引用相关的关键词或格式
            const hasReferenceContext = 
              /[\(（\[［]/.test(sentenceMatchedText) ||  // 包含括号
              /研究|指出|认为|提出|发现|表明|显示|指出|根据|参考|见|如|详见/.test(sentence) ||  // 包含引用相关动词
              sentence.length < 200;  // 句子不能太长（避免误匹配到描述性文本）
            
            if (!hasReferenceContext) {
              console.log(`跳过疑似非引用上下文: ${sentence.substring(0, 50)}...`);
              isValidReference = false;
            }
          }
          
          if (isValidReference) {
            references.push({
              sectionTitle: currentSection,
              context: sentence,
              position: i,
              lineNumber: i + 1,  // 行号从1开始
              sentenceIndex: references.length,
              citationText: sentenceMatchedText || citationText
            });
            console.log(`✓ 找到引用: 行${i+1}, 小节"${currentSection}", 匹配:"${sentenceMatchedText}"`);
          }
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
  console.log('点击引用位置:', {
    行号: ref.lineNumber,
    小节: ref.sectionTitle,
    引用文本: ref.citationText,
    上下文: ref.context
  });
  
  // 发送事件给父组件，包含完整的引用信息
  emit('referenceClicked', ref);
  
  // 提示：父组件需要监听 @referenceClicked 事件并实现跳转逻辑
  // 例如：滚动到指定行号、高亮显示引用文本
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
