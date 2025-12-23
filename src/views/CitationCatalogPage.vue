<template>
  <div class="citation-page">
    <header class="page-header">
      <div class="title-area">
        <h2>引文治理</h2>
        <p v-if="bookStore.selectedBook" class="subtitle">
          {{ bookStore.selectedBook.title }} · {{ bookStore.selectedBook.author }}
        </p>
      </div>
      <div class="actions">
        <select
          v-model.number="selectedBookId"
          class="book-select"
          @change="handleBookChange"
        >
          <option
            v-for="book in books"
            :key="book.id"
            :value="book.id"
          >
            {{ book.title || book.name }}
          </option>
        </select>
        <button class="btn secondary" @click="goBack">返回</button>
      </div>
    </header>

    <main class="page-body">
      <!-- 左：章节/小节选择 -->
      <section class="left-panel">
        <div class="panel-header">章节选择</div>
        <div v-if="!bookStore.selectedBook" class="panel-placeholder">正在加载书籍目录...</div>
        <ul v-else class="chapter-list">
          <li
            v-for="(chapter, cIndex) in bookStore.selectedBook.chapters"
            :key="chapter.chapter"
            class="chapter-item"
          >
            <div
              class="chapter-title"
              :class="{ active: expandedChapters[cIndex] }"
              @click="toggleChapter(cIndex)"
            >
              {{ chapter.title }}
              <span class="toggle-icon">{{ expandedChapters[cIndex] ? '▼' : '▶' }}</span>
            </div>
            <ul v-if="expandedChapters[cIndex]" class="section-list">
              <li
                v-for="(section, sIndex) in chapter.sections"
                :key="section.title + '-' + sIndex"
                :class="['section-item', isActiveSection(cIndex, sIndex) ? 'active' : '']"
                @click="handleSelectSection(cIndex, sIndex)"
              >
                {{ section.title }}
              </li>
            </ul>
          </li>
        </ul>
      </section>

      <!-- 中：引文目录 + 文献预览 -->
      <section class="center-panel">
        <div class="panel-header">
          <div class="header-left">
            <h4>引文目录</h4>
            <span class="citation-count">{{ citations.length }} 条</span>
          </div>
          <div class="header-actions">
            <button
              class="import-citation-btn"
              @click="showImportDialog = true"
              title="从文件导入引文列表"
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
        <div class="preview-body">
          <div v-if="loading" class="panel-placeholder">正在加载引文...</div>
          <div v-else-if="error" class="error-message">
            <p>{{ error }}</p>
            <button @click="loadCitations" class="retry-btn">重试</button>
          </div>
          <div v-else-if="citations.length === 0" class="panel-placeholder">该章节暂无参考文献</div>
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

          <div class="panel-subtitle">参考文献原文</div>
          <div v-if="!selectedCitation" class="panel-placeholder small">请从上方选择一条引文</div>
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
            <iframe
              v-if="selectedCitation.fileType === 'pdf'"
              :src="selectedCitation.fileUrl"
              class="pdf-viewer"
              frameborder="0"
            ></iframe>
            <div v-else-if="selectedCitation.fileType === 'text'" class="text-viewer">
              <pre>{{ literatureText }}</pre>
            </div>
            <div v-else class="unsupported-format">
              <p>不支持的文件格式</p>
              <a :href="selectedCitation.fileUrl" target="_blank" class="download-link">
                下载查看
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 右：引用分析 + 原文显示 -->
      <section class="right-panel">
        <div class="panel-header">正文引用分析</div>
        <div class="right-panel-content">
          <div v-if="!selectedCitation" class="panel-placeholder small">
            请选择引文查看引用分析
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
                  <div class="ref-section" v-if="ref.sectionTitle">
                    <span class="section-icon">📍</span>
                    {{ ref.sectionTitle }}
                  </div>
                  <div class="ref-context">
                    <span class="context-text">{{ ref.context }}</span>
                    <span class="citation-mark">{{ ref.citationText }}</span>
                  </div>
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
                  <div class="ref-actions">
                    <button class="jump-btn" @click.stop="scrollToReference(index)">
                      → 跳转到原文
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 原文显示 -->
          <div class="original-section">
            <div class="original-title">章节原文</div>
            <div v-if="bookStore.originalContent" class="original-content" ref="originalContentRef">
              <span
                v-for="(sentence, idx) in processedSentences"
                :key="idx"
                :id="`sentence-${idx}`"
                :class="[
                  'sentence-item',
                  { 'is-context': highlightedSentences.includes(idx) },
                ]"
              >
                {{ sentence.text }}
              </span>
            </div>
            <div v-else class="panel-placeholder small">
              暂无原文内容，请先选择左侧章节。
            </div>
          </div>
        </div>
      </section>
    </main>

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
            <strong>Markdown(.md)</strong>、<strong>文本(.txt)</strong> 或 <strong>CSV(.csv)</strong>。
          </p>
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
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { useBookStore } from '../stores/bookStore';
import { bookApi, type Book } from '../api/bookApi';

const router = useRouter();
const route = useRoute();
const bookStore = useBookStore();

// 定义引文接口
interface Citation {
  id: string;
  number: number;
  text: string;
  rawText: string;
  author?: string;
  year?: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'text' | 'other';
  fileName?: string;
}

interface CitationReference {
  sectionTitle?: string;
  context: string;
  position: number;
  sentenceIndex: number;
  lineNumber: number;
  citationText: string;
  analysisType?: 'exact' | 'paraphrase' | 'irrelevant';
}

interface SentenceItem {
  text: string;
  isTarget: boolean;
}

// 状态
const expandedChapters = ref<Record<number, boolean>>({});
const loading = ref(false);
const error = ref('');
const citations = ref<Citation[]>([]);
const selectedCitation = ref<Citation | null>(null);
const citationReferences = ref<CitationReference[]>([]);
const markdownContent = ref('');
const books = ref<Book[]>([]);
const selectedBookId = ref<number | undefined>(undefined);
const originalContentRef = ref<HTMLElement | null>(null);
const highlightedSentences = ref<number[]>([]);

// 文献上传相关状态
const showUploadDialog = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const literatureText = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

// 引文导入相关状态
const showImportDialog = ref(false);
const importFile = ref<File | null>(null);
const importFileInput = ref<HTMLInputElement | null>(null);
const importError = ref('');

// 解析 bookId
const resolveBookId = () => {
  const raw = route.params.bookId as string | undefined;
  if (selectedBookId.value) {
    return selectedBookId.value;
  }
  if (raw) {
    const n = Number(raw);
    if (!Number.isNaN(n)) return n;
  }
  return Number(bookStore.selectedBook?.id || books.value[0]?.id || 1);
};

// 加载书籍列表
const loadBooks = async () => {
  const res = await bookApi.getAllBooks();
  books.value = res.books || [];
  if (books.value.length > 0 && !selectedBookId.value) {
    const raw = route.params.bookId as string | undefined;
    selectedBookId.value =
      raw && !Number.isNaN(Number(raw)) ? Number(raw) : books.value[0].id;
  }
};

// 确保独立可用：拉书+选首章首节+展开第一章
const ensureBookAndSelection = async () => {
  const bookId = resolveBookId();
  if (!bookStore.selectedBook || Number(bookStore.selectedBook.id) !== bookId) {
    await bookStore.fetchAllMarkdownFiles(bookId);
  }
  if (
    bookStore.selectedBook &&
    bookStore.selectedBook.chapters.length > 0 &&
    (bookStore.selectedChapterIndex < 0 || bookStore.selectedSectionIndex < 0)
  ) {
    bookStore.selectSection(0, 0);
    const section = bookStore.currentSection;
    if (section?.fileId) {
      await bookStore.fetchSectionContent(section.fileId);
    }
  }
  if (bookStore.selectedBook && bookStore.selectedBook.chapters.length > 0) {
    expandedChapters.value[0] = true;
  }
};

// 加载引文
const loadCitations = async () => {
  if (!bookStore.currentSection?.fileId) {
    citations.value = [];
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const url = `http://localhost:8080/api/files/markdown/${bookStore.currentSection.fileId}/content`;
    const response = await axios.get(url);

    const content = response.data?.content || '';
    markdownContent.value = content;

    citations.value = extractCitations(content);
    console.log(`成功提取 ${citations.value.length} 条引文`);
  } catch (err: any) {
    console.error('加载引文失败:', err);
    error.value = err.response?.data?.error || '加载引文失败';
  } finally {
    loading.value = false;
  }
};

// 从Markdown内容中提取引文（完整逻辑来自 CitationViewer）
const extractCitations = (content: string): Citation[] => {
  const lines = content.split('\n');
  const citationList: Citation[] = [];
  let inReferenceSection = false;
  let citationIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^##?\s*(参考文献|REFERENCES?|引用文献|文献资料|第.+章参考文献)/i.test(line)) {
      inReferenceSection = true;
      continue;
    }

    if (inReferenceSection && /^##?\s+\d+[\.、\s]/.test(line)) {
      // 可能的章节标题
    }

    if (inReferenceSection && line.length > 0) {
      let matched = false;

      // 格式1：[数字] 引文内容
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
      }

      // 格式2：作者，年份，内容
      if (!matched) {
        const authorYearMatch = line.match(/^([^,，\d]{2,})[,，]\s*(\d{4})[,，\s]/);
        if (authorYearMatch) {
          let author = authorYearMatch[1].trim();
          const year = authorYearMatch[2];
          author = author.replace(/\s*(等|et\s*al\.?|and\s+others?)\.?\s*$/i, '').trim();
          if (author.length >= 2 && !['等', 'et al', 'etc'].includes(author)) {
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
          }
        }
      }

      // 格式3：纯数字开头
      if (!matched) {
        const numberStartMatch = line.match(/^(\d{1,3})[\s\.、]\s*(.+)[,，]\s*(\d{4})/);
        if (numberStartMatch) {
          const number = parseInt(numberStartMatch[1]);
          let author = numberStartMatch[2].trim();
          const year = numberStartMatch[3];
          author = author.replace(/\s*(等|et\s*al\.?|and\s+others?)\.?\s*$/i, '').trim();
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
          }
        }
      }

      // 格式4：单独年份开头
      if (!matched && /^\d{4}[,，]/.test(line)) {
        const yearMatch = line.match(/^(\d{4})[,，]\s*(.+)/);
        if (yearMatch) {
          const year = yearMatch[1];
          citationIndex++;
          citationList.push({
            id: `citation-year-${year}-${citationIndex}`,
            number: citationIndex,
            text: line,
            rawText: line,
            year: year
          } as any);
          matched = true;
        }
      }

      // 格式5：灵活格式
      if (!matched && /\d{4}/.test(line)) {
        const flexibleMatch = line.match(/([^,，\d]{2,20})[,，\s]+(\d{4})/);
        if (flexibleMatch) {
          let author = flexibleMatch[1].trim();
          const year = flexibleMatch[2];
          author = author.replace(/\s*(等|et\s*al\.?|and\s+others?)\.?\s*$/i, '').trim();
          const firstAuthorMatch = author.match(/^([^,，]+?)(?:[,，]|等|et\s*al)/);
          if (firstAuthorMatch) {
            author = firstAuthorMatch[1].trim();
          }
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
          }
        }
      }

      // 格式6：自由格式
      if (!matched) {
        citationIndex++;
        citationList.push({
          id: `citation-free-${citationIndex}`,
          number: citationIndex,
          text: line,
          rawText: line
        } as any);
        matched = true;
      }
    }
  }

  return citationList;
};

// 选择引文
const selectCitation = async (citation: Citation) => {
  selectedCitation.value = citation;
  findCitationReferences(citation);
  if (citation.fileUrl && citation.fileType === 'text') {
    await loadLiteratureText(citation.fileUrl);
  }
};

// 清除选择
const clearSelection = () => {
  selectedCitation.value = null;
  citationReferences.value = [];
  highlightedSentences.value = [];
};

// 在正文中查找引文引用位置
const findCitationReferences = (citation: Citation) => {
  if (!bookStore.originalContent) {
    citationReferences.value = [];
    return;
  }

  const references: CitationReference[] = [];
  const lines = bookStore.originalContent.split('\n');
  const citAny = citation as any;

  let searchPatterns: RegExp[] = [];
  let citationText = '';

  if (citation.number && !citAny.author) {
    searchPatterns.push(new RegExp(`\\[${citation.number}\\]`, 'g'));
    citationText = `[${citation.number}]`;
  }

  if (citAny.author && citAny.year) {
    const author = citAny.author.trim();
    const year = citAny.year;
    if (author.length < 2 || ['等', 'et al', 'etc'].includes(author)) {
      citationReferences.value = [];
      return;
    }
    const escapedAuthor = author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    searchPatterns.push(
      new RegExp(`${escapedAuthor}\\s*[\\(（]\\s*${year}\\s*[\\)）]`, 'g'),
      new RegExp(`[\\(（]\\s*${escapedAuthor}\\s*[,，]\\s*${year}\\s*[\\)）]`, 'g'),
      new RegExp(`[\\(（]\\s*${escapedAuthor}\\s+${year}\\s*[\\)）]`, 'g'),
      new RegExp(`[\\[［]\\s*${escapedAuthor}\\s*[,，]\\s*${year}\\s*[\\]］]`, 'g')
    );
    citationText = `${author}(${year})`;
  }

  let currentSection = '';
  let inReferenceSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##?\s*(参考文献|REFERENCES?|引用文献)/i.test(line)) {
      inReferenceSection = true;
    }
    const sectionMatch = line.match(/^#{1,6}\s+(.+)/);
    if (sectionMatch && !sectionMatch[1].includes('参考文献')) {
      currentSection = sectionMatch[1].trim();
      inReferenceSection = false;
    }
    if (inReferenceSection) {
      continue;
    }

    let foundMatch = false;
    let matchedText = '';
    for (const pattern of searchPatterns) {
      const match = pattern.exec(line);
      if (match) {
        foundMatch = true;
        matchedText = match[0];
        pattern.lastIndex = 0;
        break;
      }
    }

    if (foundMatch) {
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
          let isValidReference = true;
          if (citAny.author && citAny.year) {
            const hasReferenceContext =
              /[\(（\[［]/.test(sentenceMatchedText) ||
              /研究|指出|认为|提出|发现|表明|显示|指出|根据|参考|见|如|详见/.test(sentence) ||
              sentence.length < 200;
            if (!hasReferenceContext) {
              isValidReference = false;
            }
          }
          if (isValidReference) {
            references.push({
              sectionTitle: currentSection,
              context: sentence,
              position: i,
              lineNumber: i + 1,
              sentenceIndex: references.length,
              citationText: sentenceMatchedText || citationText
            });
          }
        }
      }
    }
  }

  citationReferences.value = references;
  updateHighlightedSentences();
};

// 更新高亮句子
const updateHighlightedSentences = () => {
  if (!bookStore.originalContent || citationReferences.value.length === 0) {
    highlightedSentences.value = [];
    return;
  }

  const highlighted = new Set<number>();
  citationReferences.value.forEach((ref) => {
    processedSentences.value.forEach((sentence, idx) => {
      if (sentence.text.includes(ref.citationText) || sentence.text.includes(ref.context.substring(0, 30))) {
        highlighted.add(idx);
      }
    });
  });
  highlightedSentences.value = Array.from(highlighted);
};

// 处理后的句子列表
const processedSentences = computed<SentenceItem[]>(() => {
  if (!bookStore.originalContent) return [];
  const raw = bookStore.originalContent.split(/([。！？\n])/);
  const result: SentenceItem[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    const s = (raw[i] || '') + (raw[i + 1] || '');
    if (!s.trim()) continue;
    result.push({
      text: s,
      isTarget: false
    });
  }
  return result;
});

// 监听引用变化，更新高亮
watch([citationReferences, processedSentences], () => {
  updateHighlightedSentences();
});

// 滚动到引用位置
const scrollToReference = async (index: number) => {
  const ref = citationReferences.value[index];
  if (!ref || !originalContentRef.value) return;

  // 查找匹配的句子
  let targetIndex = -1;
  for (let i = 0; i < processedSentences.value.length; i++) {
    const sentence = processedSentences.value[i];
    if (sentence.text.includes(ref.citationText) || sentence.text.includes(ref.context.substring(0, 30))) {
      targetIndex = i;
      break;
    }
  }

  if (targetIndex !== -1) {
    if (!highlightedSentences.value.includes(targetIndex)) {
      highlightedSentences.value.push(targetIndex);
    }
    await nextTick();
    const el = document.getElementById(`sentence-${targetIndex}`);
    if (el) {
      const container = originalContentRef.value;
      const offsetTop = el.offsetTop - container.offsetTop;
      container.scrollTop = Math.max(offsetTop - 40, 0);
      el.classList.add('citation-flash');
      setTimeout(() => {
        el.classList.remove('citation-flash');
      }, 2000);
    }
  }
};

// 处理引用点击
const handleReferenceClick = (ref: CitationReference, index: number) => {
  scrollToReference(index);
};

// 设置引用类型分析
const setAnalysisType = (index: number, type: 'exact' | 'paraphrase' | 'irrelevant') => {
  if (citationReferences.value[index]) {
    citationReferences.value[index].analysisType = type;
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

// 文件选择处理
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
};

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
  formData.append('bookId', String(resolveBookId()));

  try {
    const response = await axios.post(
      'http://localhost:8080/api/literature/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (selectedCitation.value) {
      const fileUrl = response.data.fileUrl;
      const fileType = getFileType(selectedFile.value.name);
      selectedCitation.value.fileUrl = fileUrl;
      selectedCitation.value.fileType = fileType;
      selectedCitation.value.fileName = selectedFile.value.name;
      if (fileType === 'text') {
        await loadLiteratureText(fileUrl);
      }
    }

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

const getFileType = (fileName: string): 'pdf' | 'text' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'text';
  return 'other';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// 导入文件处理
const handleImportFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    importFile.value = target.files[0];
    importError.value = '';
  }
};

const triggerImportFileSelect = () => {
  if (importFileInput.value) {
    importFileInput.value.click();
  }
};

const importCitationsFromContent = (content: string): Citation[] => {
  if (!content || !content.trim()) return [];
  if (/参考文献|REFERENCES?/i.test(content)) {
    return extractCitations(content);
  }
  const fakeMarkdown = `## 参考文献\n` + content;
  let list = extractCitations(fakeMarkdown);
  if (!list.length) {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let index = 0;
    list = lines.map((line, i) => {
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

// 章节选择相关
const toggleChapter = (index: number) => {
  expandedChapters.value[index] = !expandedChapters.value[index];
};

const handleSelectSection = async (chapterIndex: number, sectionIndex: number) => {
  bookStore.selectSection(chapterIndex, sectionIndex);
  const section = bookStore.currentSection;
  if (section?.fileId) {
    await bookStore.fetchSectionContent(section.fileId);
  }
  await loadCitations();
  clearSelection();
};

const isActiveSection = (cIndex: number, sIndex: number) =>
  cIndex === bookStore.selectedChapterIndex &&
  sIndex === bookStore.selectedSectionIndex;

// 切换书籍
const handleBookChange = async () => {
  if (!selectedBookId.value) return;

  // 先清空当前页面状态，让体验更顺滑
  loading.value = true;
  error.value = '';
  citations.value = [];
  clearSelection();
  expandedChapters.value = {};

  // 清空并重新拉取新书的目录与正文
  bookStore.clearSelection();
  await ensureBookAndSelection();
  await loadCitations();

  loading.value = false;
};

const goBack = () => {
  router.back();
};

// 监听章节切换，刷新引文
watch([() => bookStore.selectedChapterIndex, () => bookStore.selectedSectionIndex], () => {
  loadCitations();
  clearSelection();
});

onMounted(async () => {
  await loadBooks();
  await ensureBookAndSelection();
  await loadCitations();
});
</script>

<style scoped>
.citation-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f3f6fa;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
.title-area h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}
.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.btn.secondary {
  background: #f9fafb;
  color: #374151;
  border-color: #d1d5db;
}
.btn.secondary:hover {
  background: #f3f4f6;
}
.book-select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #ffffff;
  min-width: 180px;
  cursor: pointer;
}
.book-select:focus {
  outline: none;
  border-color: #00a3ff;
  box-shadow: 0 0 0 2px rgba(0, 163, 255, 0.15);
}
.page-body {
  flex: 1;
  display: flex;
  min-height: 0;
}
.left-panel {
  flex: 0 0 28%;
  min-width: 280px;
  max-width: 380px;
  border-right: 1px solid #e5e7eb;
  background: #f6f8fa;
  display: flex;
  flex-direction: column;
}
.center-panel {
  flex: 0 0 42%;
  min-width: 400px;
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.right-panel {
  flex: 1;
  background: #f6f8fa;
  display: flex;
  flex-direction: column;
}
.panel-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-left h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}
.citation-count {
  background: rgba(102, 126, 234, 0.1);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.import-citation-btn,
.clear-selection-btn {
  padding: 6px 10px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 6px;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.import-citation-btn:hover,
.clear-selection-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}
.panel-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-size: 14px;
  color: #6b7280;
}
.panel-placeholder.small {
  padding: 16px;
  justify-content: flex-start;
}
.chapter-list {
  list-style: none;
  margin: 0;
  padding: 12px 12px 16px;
  overflow-y: auto;
  flex: 1;
}
.chapter-item + .chapter-item {
  margin-top: 8px;
}
.chapter-title {
  padding: 8px 10px;
  background: #e5f3ff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1d4ed8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.chapter-title.active {
  background: #dbeafe;
}
.toggle-icon {
  font-size: 12px;
  color: #6b7280;
}
.section-list {
  list-style: none;
  margin: 4px 0 0;
  padding-left: 12px;
}
.section-item {
  padding: 6px 8px;
  font-size: 13px;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.section-item:hover {
  background: #eef2ff;
}
.section-item.active {
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 600;
  border-left: 3px solid #0ea5e9;
  padding-left: 6px;
}
.preview-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
  flex: 1;
}
.panel-subtitle {
  font-weight: 600;
  color: #111827;
  margin: 4px 0;
  font-size: 14px;
}
.citation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}
.citation-list li {
  padding: 14px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
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
}
.citation-text strong {
  color: #111827;
  font-weight: 700;
}
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
  margin-top: 8px;
}
.citation-file-indicator.no-file {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fcd34d;
  color: #92400e;
}
.no-literature {
  padding: 40px;
  text-align: center;
}
.upload-prompt {
  text-align: center;
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
.literature-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  background: #f9fafb;
  min-height: 300px;
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
.unsupported-format {
  padding: 40px;
  text-align: center;
}
.download-link {
  color: #3b82f6;
  text-decoration: underline;
}
.right-panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.analysis-content {
  flex: 0 0 auto;
  padding: 12px;
  overflow-y: auto;
  max-height: 50%;
}
.citation-full-info {
  padding: 16px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
  margin-bottom: 12px;
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
.references-section {
  margin-top: 12px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
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
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 15px;
  font-style: italic;
}
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
.ref-analysis {
  margin-bottom: 10px;
}
.analysis-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 600;
}
.analysis-buttons {
  display: flex;
  gap: 8px;
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
}
.analysis-btn.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}
.analysis-btn.active:nth-child(2) {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}
.analysis-btn.active:nth-child(3) {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}
.ref-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
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
.original-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e5e7eb;
  background: white;
  min-height: 0;
}
.original-title {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.original-content {
  flex: 1;
  padding: 8px 12px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.sentence-item {
  padding: 2px 4px;
  display: inline-block;
}
.sentence-item.is-context {
  background: #fff59d;
  border-left: 3px solid #f9a825;
}
.sentence-item.citation-flash {
  animation: flash 0.5s ease;
}
@keyframes flash {
  0%, 100% { background-color: #fff59d; }
  50% { background-color: #ffeb3b; }
}
.error-message {
  padding: 20px;
  text-align: center;
  color: #ef4444;
}
.retry-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
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
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.dialog-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
.close-btn {
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
}
.close-btn:hover {
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
}
.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}
.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

