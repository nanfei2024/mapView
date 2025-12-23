<template>
    <div class="table-page">
      <header class="page-header">
        <div class="title-area">
          <h2>表档治理</h2>
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
  
        <!-- 中：表目录 + 预览 + 上下文 -->
        <section class="center-panel">
          <div class="panel-header">表目录 & 预览</div>
          <div class="preview-body">
            <div class="panel-subtitle">表目录</div>
            <div v-if="loading" class="panel-placeholder">正在加载表格列表...</div>
            <div v-else-if="tables.length === 0" class="panel-placeholder">该章节暂无表格</div>
            <ul v-else class="table-list">
              <li
                v-for="item in tables"
                :key="item.id || item.title"
                :class="['table-item', getTableTitle(item) === selectedTableTitle ? 'active' : '']"
                @click="selectTable(item)"
              >
                <div class="table-card">
                  <div class="table-thumb-wrapper">
                    <img
                      :src="getImageUrl(item)"
                      :alt="getTableTitle(item)"
                      class="table-thumb"
                      @error="handleThumbError"
                    />
                  </div>
                  <div class="table-card-title" :title="getTableTitle(item)">
                    {{ getTableTitle(item) }}
                  </div>
                </div>
              </li>
            </ul>
  
            <div class="panel-subtitle">表格预览</div>
            <div v-if="previewUrl">
              <div class="table-main-title" v-if="selectedTableTitle">
                {{ selectedTableTitle }}
              </div>
              <div class="img-wrapper">
                <img :src="previewUrl" :alt="selectedTableTitle" />
              </div>
            </div>
            <div v-else class="panel-placeholder small">请选择上方表格</div>
  
            <div
              v-if="tableContextSectionTitle || highlightedSentences.length"
              class="context-card"
            >
              <div class="context-title" v-if="tableContextSectionTitle">
                【所在小节】: {{ tableContextSectionTitle }}
              </div>
              <div class="context-text">
                <div
                  v-for="idx in highlightedSentences"
                  :key="idx"
                  class="context-line clickable"
                  @click="scrollToOriginal(idx)"
                >
                  {{ processedSentences[idx].text }}
                </div>
              </div>
            </div>
          </div>
        </section>
  
        <!-- 右：章节原文 + 高亮 -->
        <section class="right-panel">
          <div class="panel-header">章节原文</div>
          <div v-if="bookStore.originalContent" class="original-panel">
            <div class="original-title">
              {{ bookStore.currentSection?.title || '当前章节' }}
            </div>
            <div class="original-content" ref="originalContentRef">
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
          </div>
          <div v-else class="panel-placeholder small">
            暂无原文内容，请先选择左侧章节。
          </div>
        </section>
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import axios from 'axios';
  import { useBookStore } from '../stores/bookStore';
  import { extractTableNumber } from '../utils/bookUtils';
  import { bookApi, type Book } from '../api/bookApi';
  
  const router = useRouter();
  const route = useRoute();
  const bookStore = useBookStore();
  
  const expandedChapters = ref<Record<number, boolean>>({});
  const loading = ref(false);
  const tables = ref<any[]>([]);
  const selectedTableTitle = ref('');
  const previewUrl = ref('');
  const tableContextSectionTitle = ref('');
  const tableContextText = ref('');
  const books = ref<Book[]>([]);
  const selectedBookId = ref<number | undefined>(undefined);
  const contextStartIndex = ref<number | null>(null);
  const contextEndIndex = ref<number | null>(null);
  const originalContentRef = ref<HTMLElement | null>(null);
  
  // 解析 bookId，未传则用下拉所选 / store / 第一本书 / 1
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
  
  // 当前章节编号，用于取表格列表
  const currentChapterNo = computed(() => {
    if (!bookStore.currentSection) return '';
    const match = bookStore.currentSection.title.match(/^(\d+(?:\.\d+)*)(\s|$)/);
    return match ? match[1] : '';
  });
  
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
  
  // 拉取当前小节的表格列表
  const fetchTables = async () => {
    if (!currentChapterNo.value) {
      tables.value = [];
      return;
    }
    loading.value = true;
    try {
      const bookId = resolveBookId();
      // 表格API URL格式：{chapterNo}表/tables（需要在章节编号后加"表"字符）
      const res = await axios.get(
        `http://localhost:8080/api/files/chapter/${currentChapterNo.value}表/tables?bookId=${bookId}`,
      );
      const data = res.data;
      if (data && Array.isArray(data.tables)) {
        tables.value = data.tables.filter((table: any) => {
          const name = table.name || '';
          const url = table.url || '';
          return /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(name) || /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(url);
        });
      } else {
        tables.value = [];
      }
    } catch (e) {
      tables.value = [];
    } finally {
      loading.value = false;
    }
  };
  
  // 监听章节切换，刷新表目录
  watch([() => bookStore.selectedChapterIndex, () => bookStore.selectedSectionIndex], () => {
    fetchTables();
    clearPreview();
  });
  
  onMounted(async () => {
    await loadBooks();
    await ensureBookAndSelection();
    await fetchTables();
  });
  
  const toggleChapter = (index: number) => {
    expandedChapters.value[index] = !expandedChapters.value[index];
  };
  
  const handleSelectSection = async (chapterIndex: number, sectionIndex: number) => {
    bookStore.selectSection(chapterIndex, sectionIndex);
    const section = bookStore.currentSection;
    if (section?.fileId) {
      await bookStore.fetchSectionContent(section.fileId);
    }
    await fetchTables();
    clearPreview();
  };
  
  const isActiveSection = (cIndex: number, sIndex: number) =>
    cIndex === bookStore.selectedChapterIndex &&
    sIndex === bookStore.selectedSectionIndex;
  
  const clearPreview = () => {
    selectedTableTitle.value = '';
    previewUrl.value = '';
    tableContextSectionTitle.value = '';
    tableContextText.value = '';
    contextStartIndex.value = null;
    contextEndIndex.value = null;
  };
  
  const getFileNameFromPath = (path: string) => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || path;
  };
  
  const getTableTitle = (item: any) => {
    if (item.title && String(item.title).trim()) return item.title;
    if (item.name && String(item.name).trim()) return item.name;
    if (item.url) return getFileNameFromPath(item.url);
    return '未命名表格';
  };
  
  const getImageUrl = (item: any) => {
    let imgUrl = item.url || item.path || '';
    if (imgUrl && imgUrl.startsWith('/')) {
      imgUrl = `http://localhost:8080${encodeURI(imgUrl)}`;
    }
    return imgUrl;
  };
  
  const selectTable = async (item: any) => {
    selectedTableTitle.value = getTableTitle(item);
    previewUrl.value = getImageUrl(item);
    await loadTableContext(item);
  };
  
  const handleThumbError = (e: Event) => {
    const target = e.target as HTMLImageElement;
    if (target) {
      target.style.opacity = '0.2';
    }
  };
  
  interface SentenceItem {
    text: string;
    isTarget: boolean;
  }
  
  const currentTableNumber = computed(
    () => extractTableNumber(selectedTableTitle.value) || '',
  );
  
  const processedSentences = computed<SentenceItem[]>(() => {
    if (!bookStore.originalContent) return [];
    const raw = bookStore.originalContent.split(/([。！？\n])/);
    const result: SentenceItem[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const s = (raw[i] || '') + (raw[i + 1] || '');
      if (!s.trim()) continue;
      result.push({
        text: s,
        isTarget:
          !!currentTableNumber.value &&
          s.includes('表' + currentTableNumber.value),
      });
    }
    return result;
  });
  
  const highlightedSentences = ref<number[]>([]);
  
  watch([selectedTableTitle, processedSentences], () => {
    highlightedSentences.value = processedSentences.value
      .map((s, idx) => (s.isTarget ? idx : -1))
      .filter((idx) => idx !== -1);
  });
  
  const loadTableContext = async (item: any) => {
    tableContextSectionTitle.value = '';
    tableContextText.value = '';
    contextStartIndex.value = null;
    contextEndIndex.value = null;
    if (!bookStore.currentSection) return;
    if (!bookStore.originalContent && bookStore.currentSection.fileId) {
      await bookStore.fetchSectionContent(bookStore.currentSection.fileId);
    }
    const content = bookStore.originalContent || '';
    const tableNumber = extractTableNumber(item.title) || '';
    // 优先 url 字段，没有就用 path
    let url = item.url || item.path || '';
    if (!url) {
      // markdown 可能存在转码路径
      url = '';
    }
    const ctx = findTableContextInContent(content, tableNumber, item.title, url);
    if (ctx) {
      tableContextSectionTitle.value = ctx.sectionTitle;
      tableContextText.value = ctx.contextText;
      contextStartIndex.value = ctx.startIndex;
      contextEndIndex.value = ctx.endIndex;
    }
  };
  
  // BookViewer迁移版：支持编号、标题、表格链接综合查找表格所在上下文
  const findTableContextInContent = (content: string, tableNumber: string, tableTitle: string, tableUrl?: string) => {
    const lines = content.split('\n');
    let imageLineIndex = -1;
    let sectionTitle = '';
    let sectionLineIndex = -1;
    let matchLinkLineIndex = -1;
  
    // 1. 先用编号、标题全量匹配，尽量找正文描述
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 中文编号/"表x.x" 或标题
      const patterns = [
        tableNumber ? new RegExp(`表\\s*${tableNumber.replace(/\./g, '\\.')}`) : null,
        tableNumber ? new RegExp(`如表\\s*${tableNumber.replace(/\./g, '\\.')}`) : null,
        tableNumber ? new RegExp(`\\(表\\s*${tableNumber.replace(/\./g, '\\.')}\\)`) : null,
        tableNumber ? new RegExp(`表\\s*${tableNumber.replace(/\./g, '\\.')}\\s*[:：]`) : null,
        tableTitle && tableTitle.length > 0 ? new RegExp(tableTitle.replace(/[()\[\]\{\}.*+?^$|\\]/g, r => '\\' + r)) : null,
      ].filter(Boolean);
      if (patterns.some((p) => p!.test(line))) {
        imageLineIndex = i;
        break;
      }
    }
  
    // 2. 没找到再按表格 markdown 链接/路径查找（核心改进，迁移BookViewer）
    if (imageLineIndex === -1 && tableUrl) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(tableUrl) || /!\[[^\]]*\]\([^\)]+\)/.test(lines[i])) {
          matchLinkLineIndex = i;
          imageLineIndex = i;
          break;
        }
      }
    }
    // 兜底：如果传的是文件名，也按文件名全匹配（处理如xxx.jpg）
    if (imageLineIndex === -1 && tableUrl) {
      const fname = tableUrl.split(/[\\\/"]/).pop();
      if (fname) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(fname)) {
            imageLineIndex = i;
            break;
          }
        }
      }
    }
  
    if (imageLineIndex === -1) return null;
  
    // 向上找最近的小节标题
    for (let j = imageLineIndex; j >= 0; j--) {
      const line = lines[j].trim();
      if (line === '') continue;
      if (/^#{1,6}\s+.+/.test(line) && !line.includes('图') && !line.includes('表')) {
        sectionLineIndex = j;
        sectionTitle = line.replace(/^#{1,6}\s+/, '').trim();
        break;
      }
      if (/^\d+(\.\d+)*\s+.+/.test(line) && !line.includes('图') && !line.includes('表')) {
        sectionLineIndex = j;
        sectionTitle = line.trim();
        break;
      }
      if (imageLineIndex - j > 20) break;
    }
  
    if (sectionTitle === '' && bookStore.currentSection) {
      sectionTitle = bookStore.currentSection.title;
    }
  
    const contextStart = sectionLineIndex !== -1 ? sectionLineIndex : Math.max(0, imageLineIndex - 3);
    const contextEnd = Math.min(lines.length - 1, imageLineIndex + 3);
    const contextLines = lines.slice(contextStart, contextEnd + 1);
    return {
      sectionTitle,
      contextText: contextLines.join('\n'),
      startIndex: contextStart,
      endIndex: contextEnd,
    };
  };
  
  const goBack = () => {
    router.back();
  };
  
  // 切换书籍
  const handleBookChange = async () => {
    if (!selectedBookId.value) return;
    bookStore.clearSelection();
    await ensureBookAndSelection();
    await fetchTables();
  };
  
  const scrollToOriginal = (sentenceIndex: number) => {
    if (!originalContentRef.value) return;
    const container = originalContentRef.value;
    const el = document.getElementById(`sentence-${sentenceIndex}`);
    if (!el) return;
    const offsetTop = el.offsetTop - container.offsetTop;
    container.scrollTop = Math.max(offsetTop - 40, 0);
  };
  </script>
  
  <style scoped>
  .table-page {
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
  .btn.primary {
    background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
    color: #fff;
    border-color: #00a3ff;
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
  }
  .panel-subtitle {
    font-weight: 600;
    color: #111827;
    margin: 4px 0;
  }
  .table-list {
    list-style: none;
    margin: 0;
    padding: 0 0 8px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    overflow-y: auto;
    max-height: 260px;
  }
  .table-item {
    padding: 0;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .table-item:hover {
    transform: translateY(-2px);
  }
  .table-item.active {
    transform: translateY(-2px);
  }
  .table-card {
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
    border: 1px solid #e5e7eb;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
  }
  .table-item.active .table-card {
    border-color: #00a3ff;
    box-shadow: 0 4px 12px rgba(0, 163, 255, 0.3);
  }
  .table-thumb-wrapper {
    width: 100%;
    padding-top: 70%;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    background: #f3f4f6;
  }
  .table-thumb {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .table-main-title {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  .table-card-title {
    font-size: 12px;
    color: #374151;
    line-height: 1.4;
    max-height: 3em;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .img-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px;
  }
  .img-wrapper img {
    max-width: 100%;
    max-height: 50vh;
    object-fit: contain;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .original-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
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
    background: #fff59d; /* 明亮黄色 */
    border-left: 3px solid #f9a825;
  }
  .context-line.clickable {
    cursor: pointer;
  }
  .context-line.clickable:hover {
    background: #fffde7;
  }
  .context-card {
    background: #f6f8fa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .context-title {
    font-weight: 600;
    color: #1890ff;
    margin-bottom: 6px;
  }
  .context-text {
    margin: 0;
    white-space: pre-wrap;
    font-family: Menlo, Consolas, 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #444;
  }
</style>