<template>
  <div class="book-catalog-page">
    <header class="page-header">
      <div class="title-area">
        <h2>书籍目录重构</h2>
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
        <button class="btn primary" @click="reload" :disabled="bookStore.loading">
          {{ bookStore.loading ? '正在刷新...' : '刷新目录' }}
        </button>
        <button class="btn primary" @click="exportToc" :disabled="bookStore.loading || !bookStore.selectedBook">
          导出目录
        </button>
        <button class="btn primary" @click="openDetailedToc" :disabled="!bookStore.hasSelectedSection">
          超细化目录
        </button>
      </div>
    </header>

    <main class="page-body">
      <!-- 左侧：章节目录（支持折叠/展开） -->
      <section class="left-panel">
        <div class="panel-header">书籍目录</div>

        <div v-if="bookStore.loading" class="panel-placeholder">
          正在加载目录...
        </div>

        <div v-else-if="bookStore.error" class="panel-error">
          {{ bookStore.error }}
        </div>

        <div v-else-if="!bookStore.selectedBook" class="panel-placeholder">
          暂无书籍数据
        </div>

        <ul v-else class="chapter-list">
          <li
            v-for="(chapter, cIndex) in bookStore.selectedBook.chapters"
            :key="chapter.chapter"
            class="chapter-item"
          >
            <!-- 章节标题：点击折叠/展开 -->
            <div
              class="chapter-title"
              :class="{ active: expandedChapters[cIndex] }"
              @click="toggleChapter(cIndex)"
            >
              {{ chapter.title }}
              <span class="toggle-icon">
                {{ expandedChapters[cIndex] ? '▼' : '▶' }}
              </span>
            </div>

            <!-- 小节列表 + 子目录（沿用 BookViewer 结构，过滤图/表） -->
            <ul v-if="expandedChapters[cIndex]" class="section-list">
              <li
                v-for="(section, sIndex) in chapter.sections"
                :key="section.title + '-' + sIndex"
                :class="[
                  'section-item',
                  isActiveSection(cIndex, sIndex) ? 'active' : ''
                ]"
              >
                <div class="section-title-wrapper">
                  <div
                    class="section-title-content"
                    @click="toggleSection(cIndex, sIndex, $event)"
                  >
                    {{ section.title }}
                    <span
                      class="toggle-icon small"
                      v-if="section.toc && section.toc.filter(item => !item.isImage && !/^图|^表/.test(item.title)).length > 0"
                    >
                      {{ isSectionExpanded(cIndex, sIndex) ? '▼' : '▶' }}
                    </span>
                  </div>
                </div>

                <!-- 子目录：显示 section.toc（过滤图/表），与 BookViewer 展示一致的精简版 -->
                <ul
                  v-if="section.toc && isSectionExpanded(cIndex, sIndex)"
                  class="section-subsections"
                >
                  <li
                    v-for="(tocItem, itemIndex) in section.toc.filter(item => !item.isImage && !/^图|^表/.test(item.title))"
                    :key="itemIndex"
                  >
                    <div class="subsection-title">
                      <div class="subsection-title-content">
                        <span v-if="tocItem.numericPrefix" class="toc-prefix">{{ tocItem.numericPrefix }}</span>
                        <span class="toc-title">{{ tocItem.title }}</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </section>

      <!-- 右侧：章节详情 / 原文 / 摘要 -->
      <section class="right-panel">
        <div class="panel-header detail-header">
          <div>章节详情</div>
          <div class="detail-actions" v-if="bookStore.hasSelectedSection">
            <button class="btn secondary small" @click="toggleSummary">
              {{ showSummaryPanel ? '查看原文' : '查看摘要' }}
            </button>
          </div>
        </div>

        <div v-if="bookStore.loading" class="panel-placeholder">
          正在加载内容...
        </div>

        <div v-else-if="!bookStore.hasSelectedSection" class="panel-placeholder">
          请在左侧选择一个章节
        </div>

        <div v-else class="section-detail">
          <h3 class="section-title">
            {{ bookStore.currentChapter?.title }} -
            {{ bookStore.currentSection?.title }}
          </h3>

          <div class="section-meta">
            <span>文件 ID：{{ bookStore.currentSection?.fileId ?? '未知' }}</span>
          </div>

          <!-- 摘要视图 -->
          <div v-if="showSummaryPanel" class="section-content">
            <div v-if="bookStore.summaryLoading" class="panel-placeholder small">
              正在加载摘要...
            </div>
            <div v-else>
              <div v-if="bookStore.currentSummary" class="summary-text">
                {{ bookStore.currentSummary }}
              </div>
              <div v-else class="panel-placeholder small">
                暂无摘要，可稍后在后端生成或配置。
              </div>
              <div v-if="bookStore.summaryError" class="summary-note">
                {{ bookStore.summaryError }}
              </div>
            </div>
          </div>

          <!-- 原文视图 -->
          <div v-else class="section-content">
            <pre v-if="bookStore.originalContent" class="code-block">
{{ bookStore.originalContent }}
            </pre>
            <div v-else class="panel-placeholder small">
              暂无原文内容，可稍后继续完善为 Markdown 渲染等高级功能。
            </div>
          </div>
        </div>
      </section>
    </main>
    <!-- 超细化目录弹窗（简化版，仅当前小节） -->
    <div v-if="showDetailedToc" class="detailed-toc-overlay">
      <div class="detailed-toc-container">
        <div class="detailed-toc-header">
          <h3>超细化目录</h3>
          <div class="detailed-toc-actions">
            <button class="btn secondary small" @click="showDetailedToc = false">关闭</button>
          </div>
        </div>

        <div v-if="detailedTocLoading" class="panel-placeholder">
          正在生成超细化目录...
        </div>
        <div v-else-if="detailedTocError" class="panel-error">
          {{ detailedTocError }}
        </div>
        <div v-else class="detailed-toc-body">
          <ul class="detailed-toc-list">
            <li v-for="(item, idx) in detailedTocItems" :key="idx" class="detailed-toc-item">
              <div class="detailed-toc-title">
                <span v-if="item.numericPrefix" class="toc-prefix">{{ item.numericPrefix }}</span>
                <span>{{ item.title }}</span>
              </div>
              <ul v-if="item.items && item.items.length > 0" class="detailed-sub-list">
                <li v-for="(sub, sIdx) in item.items" :key="sIdx" class="detailed-sub-item">
                  <span v-if="sub.numericPrefix" class="toc-prefix">{{ sub.numericPrefix }}</span>
                  <span>{{ sub.title }}</span>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBookStore } from '../stores/bookStore';
import axios from 'axios';
import { bookApi, type Book } from '../api/bookApi';

const route = useRoute();
const router = useRouter();
const bookStore = useBookStore();

// 章节展开状态
const expandedChapters = ref<Record<number, boolean>>({});
// 小节子目录展开状态（对齐 BookViewer 的 key 规则）
const expandedSections = ref<Record<string, boolean>>({});
// 摘要/原文视图
const showSummaryPanel = ref(false);

// 超细化目录弹窗
const showDetailedToc = ref(false);
const detailedTocLoading = ref(false);
const detailedTocError = ref('');
const detailedTocItems = ref<any[]>([]);

// 书籍列表与选中
const books = ref<Book[]>([]);
const selectedBookId = ref<number | undefined>(undefined);

// 从路由/下拉/已选书中解析 bookId，默认 1
const resolveBookId = () => {
  const raw = route.params.bookId as string | undefined;
  if (selectedBookId.value) return selectedBookId.value;
  if (raw && !Number.isNaN(Number(raw))) return Number(raw);
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

// 保证书籍和章节已选中，并预取首节内容
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
    expandedChapters.value = { 0: true };
  } else {
    expandedChapters.value = {};
  }
};

const loadData = async () => {
  await ensureBookAndSelection();
};

onMounted(async () => {
  await loadBooks();
  await loadData();
});

const goBack = () => {
  router.back();
};

const reload = () => {
  loadData();
};

// 切换书籍
const handleBookChange = async () => {
  if (!selectedBookId.value) return;
  // 清空当前状态以避免旧数据闪烁
  bookStore.clearSelection();
  expandedChapters.value = {};
  showSummaryPanel.value = false;
  detailedTocItems.value = [];
  await ensureBookAndSelection();
};

const toggleChapter = (index: number) => {
  expandedChapters.value[index] = !expandedChapters.value[index];
};

// 选中小节并加载原文
const handleSelectSection = async (chapterIndex: number, sectionIndex: number) => {
  bookStore.selectSection(chapterIndex, sectionIndex);
  const section = bookStore.currentSection;
  if (section?.fileId) {
    await bookStore.fetchSectionContent(section.fileId);

    // 如果 toc 未加载，调用 fetchFileToc 补齐（对齐 BookViewer 行为）
    if (!section.toc) {
      const res = await bookStore.fetchFileToc(section.fileId);
      if (res && res.toc) {
        // 过滤掉图/表
        section.toc = res.toc.map((item: any) => {
          const isImage = Boolean(
            item.title?.trim().startsWith('图') ||
            (item.numericPrefix && item.numericPrefix.startsWith('图'))
          );
          return { ...item, isImage };
        });
      }
    }
  }
  showSummaryPanel.value = false; // 切换章节时回到原文视图
};

const isActiveSection = (cIndex: number, sIndex: number) =>
  cIndex === bookStore.selectedChapterIndex &&
  sIndex === bookStore.selectedSectionIndex;

// 子目录展开/折叠（对齐 BookViewer）
const toggleSection = (chapterIndex: number, sectionIndex: number, event?: Event) => {
  if (event) event.stopPropagation();
  const key = `${chapterIndex}-${sectionIndex}`;
  expandedSections.value[key] = !expandedSections.value[key];
  // 展开时选中该小节
  if (expandedSections.value[key]) {
    handleSelectSection(chapterIndex, sectionIndex);
  }
};

const isSectionExpanded = (chapterIndex: number, sectionIndex: number) => {
  const key = `${chapterIndex}-${sectionIndex}`;
  return !!expandedSections.value[key];
};

// 摘要 / 原文切换（property 取法完全对齐 BookViewer）
const toggleSummary = async () => {
  if (!bookStore.currentSection) return;

  if (!showSummaryPanel.value) {
    const rawTitle = bookStore.currentSection.title || '';
    const property = rawTitle.split(' ')[0]; // 与 BookViewer 保持一致
    if (property) {
      await bookStore.fetchSummary(property);
    }
  }

  showSummaryPanel.value = !showSummaryPanel.value;
};

// 导出目录（精简版，复用 BookViewer 的思路：过滤图/表）
const exportToc = async () => {
  if (!bookStore.selectedBook) return;

  // 确保每个 section 有 toc（若无则调用 fetchFileToc）
  for (const chapter of bookStore.selectedBook.chapters) {
    for (const section of chapter.sections) {
      if (section.fileId && !section.toc) {
        const res = await bookStore.fetchFileToc(section.fileId);
        if (res && res.toc) {
          section.toc = res.toc.filter(
            (item: any) =>
              !item.isImage &&
              !item.title?.trim().startsWith('图') &&
              !item.title?.trim().startsWith('表'),
          );
        }
      }
    }
  }

  // 生成 Markdown
  let content = `# ${bookStore.selectedBook.title}\n\n`;
  bookStore.selectedBook.chapters.forEach((chapter) => {
    content += `## ${chapter.title}\n\n`;
    chapter.sections.forEach((section) => {
      // 提取编号 + 标题
      const match = section.title.match(/^(\d+(?:\.\d+)*)(\s|$)(.*)/);
      const sectionNumber = match ? match[1] : '';
      const sectionTitle = match ? match[3] : section.title;
      if (sectionNumber) {
        content += `### ${sectionNumber} ${sectionTitle}\n`;
        if (section.toc && section.toc.length > 0) {
          const nonImageItems = section.toc.filter(
            (item) =>
              !item.isImage &&
              !item.title?.trim().startsWith('图') &&
              !item.title?.trim().startsWith('表'),
          );
          const processTocItems = (items: any[], level = 1) => {
            items.forEach((tocItem) => {
              const indent = '  '.repeat(level);
              const line = `${indent}- ${tocItem.numericPrefix || ''} ${tocItem.title || ''}`.trimEnd();
              content += `${line}\n`;
            });
          };
          processTocItems(nonImageItems);
          content += '\n';
        }
      }
    });
  });

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bookStore.selectedBook.title}-目录.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 超细化目录（简化：仅对当前选中小节调用后端 detailed-toc 接口）
const openDetailedToc = async () => {
  if (!bookStore.currentSection || !bookStore.currentSection.fileId) return;
  detailedTocLoading.value = true;
  detailedTocError.value = '';
  detailedTocItems.value = [];
  showDetailedToc.value = true;
  try {
    const url = `http://localhost:8080/api/files/markdown/${bookStore.currentSection.fileId}/detailed-toc`;
    const res = await axios.get(url);
    if (res.data && res.data.toc) {
      detailedTocItems.value = res.data.toc;
    } else {
      detailedTocError.value = '未返回目录数据';
    }
  } catch (e: any) {
    detailedTocError.value = e?.message || '获取超细化目录失败';
  } finally {
    detailedTocLoading.value = false;
  }
};
</script>

<style scoped>
.book-catalog-page {
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
}

.book-select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #ffffff;
  min-width: 200px;
  cursor: pointer;
}

.book-select:focus {
  outline: none;
  border-color: #00a3ff;
  box-shadow: 0 0 0 2px rgba(0, 163, 255, 0.15);
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

.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.secondary {
  background: #f9fafb;
  color: #374151;
  border-color: #d1d5db;
}

.btn.primary:hover:not(:disabled) {
  box-shadow: 0 3px 10px rgba(0, 163, 255, 0.35);
}

.btn.secondary:hover {
  background: #f3f4f6;
}

.btn.small {
  padding: 4px 10px;
  font-size: 12px;
}

.page-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.left-panel {
  flex: 0 0 32%;
  min-width: 320px;
  max-width: 420px;
  border-right: 1px solid #e5e7eb;
  background: #f6f8fa;
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

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.panel-placeholder,
.panel-error {
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

.panel-error {
  color: #b91c1c;
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

.section-title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: 8px;
}

.section-title-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  line-height: 1.5;
  gap: 8px;
}

.section-detail {
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.section-meta {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
}

.section-content {
  flex: 1;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 12px 14px;
  overflow: auto;
}

.code-block {
  margin: 0;
  font-family: Menlo, Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.summary-text {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
  white-space: pre-line;
}

.summary-note {
  margin-top: 8px;
  padding: 8px 10px;
  background: #fffbe6;
  border-left: 3px solid #f59e0b;
  font-size: 12px;
  color: #92400e;
}

/* 超细化目录弹窗样式（简化版） */
.detailed-toc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.detailed-toc-container {
  width: 70%;
  max-width: 900px;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.detailed-toc-header {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detailed-toc-actions {
  display: flex;
  gap: 8px;
}

.detailed-toc-body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px;
}

.detailed-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.detailed-toc-item {
  padding: 8px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.detailed-toc-title {
  font-weight: 600;
  color: #111827;
  display: flex;
  gap: 6px;
  align-items: center;
}

.toc-prefix {
  color: #6b7280;
  font-size: 12px;
}

.detailed-sub-list {
  list-style: none;
  margin: 6px 0 0 16px;
  padding: 0;
}

.detailed-sub-item {
  padding: 4px 0;
  color: #374151;
}
</style>