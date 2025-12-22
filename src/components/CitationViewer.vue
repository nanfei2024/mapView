<template>
  <div class="citation-viewer-wrapper">
    <div class="citation-viewer-three-column">
    <!-- 左栏：引文目录 -->
    <div class="citation-catalog-panel">
      <div class="catalog-header">
        <div class="header-left">
          <h4>引文目录</h4>
          <span class="citation-count">{{ citations.length }} 条</span>
        </div>
        <div class="header-actions">
          <button 
            class="import-citation-btn"
            @click="showImportDialog = true"
            title="从文件导入引文列表（支持 Markdown / 文本）"
          >
            📥 导入
          </button>
          <button 
            v-if="selectedCitation" 
            @click="clearSelection" 
            class="clear-selection-btn"
            title="清除选择"
          >
            ✕
          </button>
        </div>
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
          <div class="citation-header">
            <span class="citation-number">
              <template v-if="citation.author">📚</template>
              <template v-else>[{{ citation.number }}]</template>
            </span>
            <span class="citation-text">
              <template v-if="citation.author">
                <strong>{{ citation.author }}</strong> ({{ citation.year }})
              </template>
              <template v-else>{{ citation.text.substring(0, 50) }}...</template>
            </span>
          </div>
          <!-- 文献文件指示器 -->
          <div class="citation-file-indicator" v-if="citation.fileUrl">
            <span class="file-icon">📄</span>
            <span class="file-status">已关联文献</span>
          </div>
          <div class="citation-file-indicator no-file" v-else>
            <span class="file-icon">📤</span>
            <span class="file-status">未上传文献</span>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- 中栏：参考文献原文 -->
    <div class="literature-viewer-panel">
      <div class="panel-header">
        <h4>参考文献原文</h4>
        <button 
          v-if="selectedCitation && !selectedCitation.fileUrl" 
          @click="showUploadDialog = true"
          class="upload-btn"
        >
          📤 上传文献
        </button>
      </div>
      
      <div v-if="!selectedCitation" class="placeholder">
        <p>👈 请从左侧选择一条引文</p>
      </div>
      
      <div v-else-if="!selectedCitation.fileUrl" class="no-literature">
        <div class="upload-prompt">
          <p class="prompt-icon">📚</p>
          <p class="prompt-text">该参考文献尚未上传原文</p>
          <button @click="showUploadDialog = true" class="upload-btn-large">
            点击上传PDF或文本文件
          </button>
        </div>
      </div>
      
      <div v-else class="literature-content">
        <!-- PDF文件显示 -->
        <iframe 
          v-if="selectedCitation.fileType === 'pdf'"
          :src="selectedCitation.fileUrl"
          class="pdf-viewer"
          frameborder="0"
        ></iframe>
        
        <!-- 文本文件显示 -->
        <div v-else-if="selectedCitation.fileType === 'text'" class="text-viewer">
          <pre>{{ literatureText }}</pre>
        </div>
        
        <!-- 其他格式提示 -->
        <div v-else class="unsupported-format">
          <p>不支持的文件格式</p>
          <a :href="selectedCitation.fileUrl" target="_blank" class="download-link">
            下载查看
          </a>
        </div>
      </div>
    </div>
    
    <!-- 右栏：引用详情和分析 -->
    <div class="reference-analysis-panel">
      <div class="panel-header">
        <h4>正文引用分析</h4>
      </div>
      
      <div v-if="!selectedCitation" class="placeholder">
        <p>请选择引文</p>
      </div>
      
      <div v-else class="analysis-content">
        <!-- 完整引文信息 -->
        <div class="citation-full-info">
          <div class="info-label">完整引文</div>
          <div class="info-content">
            [{{ selectedCitation.number }}] {{ selectedCitation.text }}
          </div>
        </div>
        
        <!-- 正文引用位置列表 -->
        <div class="references-section">
          <div class="section-header">
            <h5>正文引用位置</h5>
            <span class="ref-count">{{ citationReferences.length }}处</span>
          </div>
          
          <div v-if="citationReferences.length === 0" class="no-references">
            <p>正文中未找到此引文的引用</p>
          </div>
          
          <div v-else class="reference-list">
            <div 
              v-for="(ref, index) in citationReferences" 
              :key="index"
              class="reference-item"
              @click="handleReferenceClick(ref, index)"
            >
              <!-- 小节标题 -->
              <div class="ref-section" v-if="ref.sectionTitle">
                <span class="section-icon">📍</span>
                {{ ref.sectionTitle }}
              </div>
              
              <!-- 引用上下文 -->
              <div class="ref-context">
                <span class="context-text">{{ ref.context }}</span>
                <span class="citation-mark">{{ ref.citationText }}</span>
              </div>
              
              <!-- 引用类型分析 -->
              <div class="ref-analysis">
                <div class="analysis-label">引用类型：</div>
                <div class="analysis-buttons">
                  <button 
                    :class="['analysis-btn', { 'active': ref.analysisType === 'exact' }]"
                    @click.stop="setAnalysisType(index, 'exact')"
                    title="引用内容与原文高度一致"
                  >
                    ✓ 完全引用
                  </button>
                  <button 
                    :class="['analysis-btn', { 'active': ref.analysisType === 'paraphrase' }]"
                    @click.stop="setAnalysisType(index, 'paraphrase')"
                    title="表达了相同的意思但措辞不同"
                  >
                    ≈ 意思引用
                  </button>
                  <button 
                    :class="['analysis-btn', { 'active': ref.analysisType === 'irrelevant' }]"
                    @click.stop="setAnalysisType(index, 'irrelevant')"
                    title="引用与原文内容无关"
                  >
                    ✗ 无关引用
                  </button>
                </div>
              </div>
              
              <!-- 跳转按钮 -->
              <div class="ref-actions">
                <button class="jump-btn" @click.stop="scrollToReference(index)">
                  → 跳转到原文
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    </div>
    
    <!-- 文献上传对话框 -->
    <div v-if="showUploadDialog" class="upload-dialog-overlay" @click="showUploadDialog = false">
      <div class="upload-dialog" @click.stop>
        <div class="dialog-header">
          <h4>上传参考文献原文</h4>
          <button @click="showUploadDialog = false" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <p class="upload-hint">
            为引文 <strong>[{{ selectedCitation?.number }}]</strong> 上传原始文献文件
          </p>
          <div class="upload-area">
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileSelect"
              accept=".pdf,.txt,.doc,.docx"
              class="file-input"
            />
            <div class="upload-prompt-area" @click="triggerLiteratureFileSelect">
              <p class="upload-icon">📤</p>
              <p>点击选择文件或拖拽文件到此处</p>
              <p class="file-types">支持格式: PDF, TXT, DOC, DOCX</p>
            </div>
          </div>
          <div v-if="selectedFile" class="selected-file">
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="showUploadDialog = false" class="cancel-btn">取消</button>
          <button 
            @click="uploadLiteratureFile" 
            :disabled="!selectedFile || uploading"
            class="confirm-btn"
          >
            {{ uploading ? '上传中...' : '确认上传' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 引文列表导入对话框 -->
    <div v-if="showImportDialog" class="upload-dialog-overlay" @click="showImportDialog = false">
      <div class="upload-dialog" @click.stop>
        <div class="dialog-header">
          <h4>导入引文目录</h4>
          <button @click="showImportDialog = false" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <p class="upload-hint">
            选择一份包含引文条目的文件，支持 
            <strong>Markdown(.md)</strong>、<strong>文本(.txt)</strong> 或 <strong>CSV(.csv)</strong>。<br/>
            - 若是完整章节的 Markdown，请直接上传原文件；<br/>
            - 若是仅包含引文列表，可按一行一条或 CSV 形式书写。
          </p>
          <div class="import-scope">
            <label>
              <input type="radio" value="chapter" v-model="importScope" />
              作用于当前章节（随章节切换重载）
            </label>
            <label>
              <input type="radio" value="book" v-model="importScope" />
              作用于全书（切换章节时保留目录，仅重新解析正文引用）
            </label>
          </div>
          <div class="upload-area">
            <input 
              type="file" 
              ref="importFileInput" 
              @change="handleImportFileSelect"
              accept=".md,.markdown,.txt,.csv"
              class="file-input"
            />
            <div class="upload-prompt-area" @click="triggerImportFileSelect">
              <p class="upload-icon">📥</p>
              <p>点击选择引文文件或拖拽文件到此处</p>
              <p class="file-types">支持格式: .md, .markdown, .txt, .csv</p>
            </div>
          </div>
          <div v-if="importFile" class="selected-file">
            <span class="file-name">{{ importFile.name }}</span>
            <span class="file-size">{{ formatFileSize(importFile.size) }}</span>
          </div>
          <div v-if="importError" class="error-message">
            <p>{{ importError }}</p>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="showImportDialog = false" class="cancel-btn">取消</button>
          <button 
            @click="parseImportFile" 
            :disabled="!importFile"
            class="confirm-btn"
          >
            解析并替换当前引文列表
          </button>
        </div>
      </div>
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
  fileUrl?: string;  // 文献文件URL
  fileType?: 'pdf' | 'text' | 'other';  // 文件类型
  fileName?: string; // 文件名
}

interface CitationReference {
  sectionTitle?: string;
  context: string;
  position: number;  // 在markdown中的行号
  sentenceIndex: number;
  lineNumber: number;  // 具体行号（用于跳转）
  citationText: string;  // 引用标注文本（用于高亮）
  analysisType?: 'exact' | 'paraphrase' | 'irrelevant';  // 引用类型分析
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

// 文献上传相关状态
const showUploadDialog = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const literatureText = ref('');  // 文本文件内容
const fileInput = ref<HTMLInputElement | null>(null);

// 引文导入相关状态
const showImportDialog = ref(false);
const importFile = ref<File | null>(null);
const importFileInput = ref<HTMLInputElement | null>(null);
const importError = ref('');
const importScope = ref<'chapter' | 'book'>('chapter');
const importedFromFile = ref(false); // 是否有全书范围的导入

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

      // 格式6：无编号的自由格式行（兜底逻辑）
      // 场景：整本书的“参考文献”列表没有编号，每行一条。此时也要生成条目。
      if (!matched) {
        citationIndex++;
        citationList.push({
          id: `citation-free-${citationIndex}`,
          number: citationIndex,
          text: line,
          rawText: line
        } as any);
        matched = true;
        console.log(`提取自由格式引文 (${citationIndex}): ${line.substring(0, 30)}...`);
      }
    }
  }
  
  console.log(`总共提取 ${citationList.length} 条参考文献`);
  return citationList;
};

// 选择引文
const selectCitation = async (citation: Citation) => {
  selectedCitation.value = citation;
  
  // 在正文中查找引用位置
  findCitationReferences(citation);
  
  // 如果有关联的文献文件，加载文献内容
  if (citation.fileUrl && citation.fileType === 'text') {
    await loadLiteratureText(citation.fileUrl);
  }
  
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
    if (importScope.value === 'book' && importedFromFile.value) {
      // 仅更新正文内容，用于引用定位，不覆盖全书导入的引文目录
      fetchMarkdownContentOnly(newFileId);
    } else {
      loadCitations();
    }
  } else {
    citations.value = [];
    selectedCitation.value = null;
  }
}, { immediate: true });

// 仅获取正文内容（不替换引文列表）
const fetchMarkdownContentOnly = async (fileId: number) => {
  try {
    const url = `http://localhost:8080/api/files/markdown/${fileId}/content`;
    const response = await axios.get(url);
    markdownContent.value = response.data?.content || '';
  } catch (err: any) {
    console.error('加载章节内容失败:', err);
  }
};

// 加载文本文件内容
const loadLiteratureText = async (url: string) => {
  try {
    const response = await axios.get(url);
    literatureText.value = response.data;
  } catch (err) {
    console.error('加载文献文本失败:', err);
    literatureText.value = '加载文献内容失败';
  }
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
};

// 触发文献文件选择
const triggerLiteratureFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 上传文献文件
const uploadLiteratureFile = async () => {
  if (!selectedFile.value || !selectedCitation.value) return;
  
  uploading.value = true;
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('citationId', selectedCitation.value.id);
  formData.append('bookId', String(props.bookId || 1));
  
  try {
    // 调用后端API上传文件
    const response = await axios.post(
      'http://localhost:8080/api/literature/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('文献上传成功:', response.data);
    
    // 更新引文的文件信息
    if (selectedCitation.value) {
      const fileUrl = response.data.fileUrl;
      const fileType = getFileType(selectedFile.value.name);
      
      selectedCitation.value.fileUrl = fileUrl;
      selectedCitation.value.fileType = fileType;
      selectedCitation.value.fileName = selectedFile.value.name;
      
      // 如果是文本文件，立即加载内容
      if (fileType === 'text') {
        await loadLiteratureText(fileUrl);
      }
    }
    
    // 关闭对话框
    showUploadDialog.value = false;
    selectedFile.value = null;
    
    alert('文献上传成功！');
  } catch (err) {
    console.error('文献上传失败:', err);
    alert('文献上传失败，请重试');
  } finally {
    uploading.value = false;
  }
};

// 获取文件类型
const getFileType = (fileName: string): 'pdf' | 'text' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'text';
  return 'other';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// 处理导入文件选择
const handleImportFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    importFile.value = target.files[0];
    importError.value = '';
  }
};

// 触发导入文件选择
const triggerImportFileSelect = () => {
  if (importFileInput.value) {
    importFileInput.value.click();
  }
};

// 将导入文件内容解析为 Citation 列表
const importCitationsFromContent = (content: string): Citation[] => {
  if (!content || !content.trim()) return [];

  // 如果文本中本身包含“参考文献/REFERENCES”等标题，直接按完整 markdown 处理
  if (/参考文献|REFERENCES?/i.test(content)) {
    return extractCitations(content);
  }

  // 否则构造一个虚拟的“参考文献章节”包装，再复用现有 extractCitations 逻辑
  const fakeMarkdown = `## 参考文献\n` + content;
  let list = extractCitations(fakeMarkdown);

  // 如果仍未解析出任何条目，尝试按“每行一条”的简单规则兜底
  if (!list.length) {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let index = 0;
    list = lines.map((line, i) => {
      // 支持前缀 [n] 或 n. 之类，尽量保持原编号，否则用行号顺序
      const numberedMatch = line.match(/^[\[\(]?(\d+)[\]\)\.\、]?\s*(.+)$/);
      if (numberedMatch) {
        const num = parseInt(numberedMatch[1]);
        const text = numberedMatch[2];
        return {
          id: `imp-${num}`,
          number: num,
          text,
          rawText: line
        } as Citation;
      }
      index++;
      return {
        id: `imp-line-${i + 1}`,
        number: index,
        text: line,
        rawText: line
      } as Citation;
    });
  }

  return list;
};

// 解析导入文件
const parseImportFile = () => {
  if (!importFile.value) return;

  importError.value = '';
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const text = String(reader.result || '');
      const imported = importCitationsFromContent(text);

      if (!imported.length) {
        importError.value = '未能从文件中解析出任何引文，请检查格式。';
        return;
      }

      citations.value = imported;
      selectedCitation.value = null;
      citationReferences.value = [];
      showImportDialog.value = false;
      importFile.value = null;
      importedFromFile.value = importScope.value === 'book';
      alert(`成功导入 ${imported.length} 条引文。`);
    } catch (e: any) {
      console.error('解析引文文件失败:', e);
      importError.value = e?.message || '解析引文文件时发生错误';
    }
  };

  reader.onerror = () => {
    importError.value = '读取文件失败，请重试。';
  };

  reader.readAsText(importFile.value, 'utf-8');
};

// 设置引用类型分析
const setAnalysisType = (index: number, type: 'exact' | 'paraphrase' | 'irrelevant') => {
  if (citationReferences.value[index]) {
    citationReferences.value[index].analysisType = type;
    console.log(`设置引用类型 [${index}]: ${type}`);
    
    // TODO: 调用后端API保存分析结果
    // await axios.post('/api/citation/analysis', {
    //   citationId: selectedCitation.value?.id,
    //   referenceIndex: index,
    //   analysisType: type
    // });
  }
};

// 处理引用点击
const handleReferenceClick = (ref: CitationReference, index: number) => {
  console.log('点击引用:', ref);
  // 可以在这里添加额外的处理逻辑，比如在中栏文献中高亮对应内容
};

// 暴露方法供父组件调用
defineExpose({
  loadCitations,
  clearSelection
});
</script>

<style scoped>
/* 外层包裹容器 */
.citation-viewer-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* 三栏布局容器 */
.citation-viewer-three-column {
  display: grid;
  grid-template-columns: 320px 1.2fr 380px;
  gap: 14px;
  flex: 1;
  min-height: 0;
  padding: 12px;
  background: #f5f7fa;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
}

/* 横向滚动条样式 - 类似竖向滚动条 */
.citation-viewer-three-column::-webkit-scrollbar {
  height: 10px;
}

.citation-viewer-three-column::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 5px;
  margin: 0 12px;
}

.citation-viewer-three-column::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
  transition: background 0.3s;
}

.citation-viewer-three-column::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #5568d3 0%, #6a4190 100%);
}

/* Firefox滚动条 */
.citation-viewer-three-column {
  scrollbar-width: thin;
  scrollbar-color: #667eea #f0f0f0;
}

/* 左栏：引文目录 */
.citation-catalog-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-width: 280px;
  max-width: 400px;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.catalog-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.citation-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.clear-selection-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.clear-selection-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.import-citation-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.import-citation-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.citation-list {
  list-style: none;
  padding: 12px;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  background: #f9fafb;
}

.citation-list li {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  margin-bottom: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.citation-list li:hover {
  border-left-color: #667eea;
  background: #fafbff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.citation-list li.active {
  border-left-color: #667eea;
  border-color: #c7d2fe;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
  transform: translateY(-2px);
}

.citation-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.citation-number {
  flex-shrink: 0;
  font-weight: 700;
  color: #667eea;
  font-size: 16px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-radius: 6px;
}

.citation-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.65;
  color: #1f2937;
  font-weight: 500;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.citation-text strong {
  color: #111827;
  font-weight: 700;
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

/* 文件指示器样式 */
.citation-file-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #065f46;
  border: 1px solid #6ee7b7;
  align-self: flex-start;
}

.citation-file-indicator .file-icon {
  font-size: 14px;
}

.citation-file-indicator .file-status {
  letter-spacing: 0.3px;
}

.citation-file-indicator.no-file {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fcd34d;
  color: #92400e;
}

/* 加载和错误状态 */
.loading-indicator,
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6b7280;
}

.loading-indicator p,
.error-message p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.no-citations {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 14px;
  font-style: italic;
}

/* 右栏：引用分析面板 */
.reference-analysis-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-width: 300px;
}

.reference-analysis-panel .panel-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 12px 16px;
  flex-shrink: 0;
}

.reference-analysis-panel .panel-header h4 {
  margin: 0;
  font-size: 16px;
  color: white;
  font-weight: 700;
}

.reference-analysis-panel .placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #9ca3af;
  font-weight: 500;
}

.analysis-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.citation-full-info {
  padding: 16px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  margin: 12px;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
  flex-shrink: 0;
}

.info-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #92400e;
  font-weight: 700;
  margin-bottom: 10px;
}

.info-content {
  font-size: 13px;
  line-height: 1.7;
  color: #451a03;
  font-weight: 500;
}

/* 中栏面板优化 */
.literature-viewer-panel {
  min-width: 300px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.literature-viewer-panel .panel-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 12px 16px;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.literature-viewer-panel .panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.upload-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 中栏文献查看器样式 */
.literature-viewer-panel .placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #9ca3af;
  font-weight: 500;
}

.no-literature {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-prompt {
  text-align: center;
  padding: 40px;
}

.prompt-icon {
  font-size: 72px;
  margin-bottom: 20px;
  opacity: 0.8;
}

.prompt-text {
  font-size: 16px;
  color: #4b5563;
  margin-bottom: 24px;
  font-weight: 500;
}

.upload-btn-large {
  padding: 14px 28px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.upload-btn-large:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

/* PDF和文本查看器 */
.literature-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  background: #f9fafb;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}

.text-viewer {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: white;
}

.text-viewer pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  color: #374151;
  margin: 0;
}

/* 引用分析按钮组优化 */
.reference-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.reference-item {
  padding: 14px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  cursor: pointer;
}

.reference-item:hover {
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
  transform: translateY(-2px);
}

.ref-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #d1d5db;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ref-context {
  margin-bottom: 12px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.context-text {
  font-size: 13px;
  line-height: 1.7;
  color: #1e40af;
  display: block;
  margin-bottom: 8px;
}

.citation-mark {
  display: inline-block;
  padding: 3px 8px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 4px;
  font-size: 12px;
  color: #92400e;
  font-weight: 700;
}

.analysis-btn {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.analysis-btn:hover {
  border-color: #60a5fa;
  background: #eff6ff;
  color: #1e40af;
  transform: translateY(-1px);
}

.analysis-btn.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
}

.analysis-btn.active:nth-child(2) {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.2);
}

.analysis-btn.active:nth-child(3) {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
}

.jump-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.jump-btn:hover {
  transform: translateX(3px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 上传对话框样式 */
.upload-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.upload-dialog {
  background: white;
  border-radius: 16px;
  width: 540px;
  max-width: 90%;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
  animation: dialogSlideIn 0.3s ease;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 16px 16px 0 0;
}

.dialog-header h4 {
  margin: 0;
  font-size: 18px;
  color: #111827;
  font-weight: 700;
}

.dialog-header .close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.dialog-header .close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.dialog-body {
  padding: 24px;
}

.upload-hint {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.6;
}

.upload-hint strong {
  color: #111827;
  font-weight: 700;
}

.upload-area {
  position: relative;
  margin-bottom: 16px;
}

.file-input {
  display: none;
}

.upload-prompt-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.upload-prompt-area:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.upload-icon {
  font-size: 56px;
  margin-bottom: 16px;
  display: block;
}

.upload-prompt-area p {
  margin: 0;
  font-size: 15px;
  color: #374151;
  font-weight: 500;
}

.file-types {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 10px;
}

.selected-file {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #bfdbfe;
  margin-top: 16px;
}

.file-name {
  font-size: 14px;
  color: #1e40af;
  font-weight: 600;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 13px;
  color: #60a5fa;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.cancel-btn {
  padding: 10px 20px;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.confirm-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 引用分析面板部分样式补充 */
.references-section {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  min-height: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.section-header h5 {
  margin: 0;
  font-size: 15px;
  color: #111827;
  font-weight: 700;
}

.ref-count {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid #93c5fd;
}

.no-references {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 15px;
  font-style: italic;
}

.ref-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.analysis-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.analysis-buttons {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .citation-viewer-three-column {
    grid-template-columns: 280px 1fr 340px;
  }
}

@media (max-width: 1200px) {
  .citation-viewer-three-column {
    grid-template-columns: 260px 1fr 300px;
    gap: 10px;
  }
  
  .citation-catalog-panel {
    min-width: 240px;
  }
}

/* 滚动条美化 */
.citation-list::-webkit-scrollbar,
.references-section::-webkit-scrollbar,
.text-viewer::-webkit-scrollbar {
  width: 8px;
}

.citation-list::-webkit-scrollbar-track,
.references-section::-webkit-scrollbar-track,
.text-viewer::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.citation-list::-webkit-scrollbar-thumb,
.references-section::-webkit-scrollbar-thumb,
.text-viewer::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.citation-list::-webkit-scrollbar-thumb:hover,
.references-section::-webkit-scrollbar-thumb:hover,
.text-viewer::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 确保目录面板内容不会溢出 */
.citation-catalog-panel {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
