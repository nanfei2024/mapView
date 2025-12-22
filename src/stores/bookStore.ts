import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

// 这里的类型先从 BookViewer 中精简一版，后续可以逐步完善/统一
interface TocItem {
  level: number;
  title: string;
  numericPrefix: string;
  id?: string;
  isImage?: boolean;
  parentSection?: string;
}

interface Section {
  title: string;
  pageNumber: number;
  fileId?: number;
  content?: string;
  toc?: TocItem[];
}

interface Chapter {
  title: string;
  sections: Section[];
  expanded?: boolean;
  chapter: string;
}

export interface Book {
  id: string | number;
  title: string;
  author: string;
  coverUrl: string;
  chapters: Chapter[];
}

interface MarkdownFile {
  id: number;
  property: string;
  file_path: string;
  file_type: string;
  is_directory?: boolean;
  fileName?: string;
}

interface ContentResponse {
  content?: string;
  fileInfo?: {
    id: number;
    property: string;
    file_path: string;
  };
  error?: string;
}

export const useBookStore = defineStore('book', () => {
  // ------- 核心状态 -------
  const selectedBook = ref<Book | null>(null);
  const selectedChapterIndex = ref(-1);
  const selectedSectionIndex = ref(-1);

  const loading = ref(false);
  const error = ref('');

  const originalContent = ref('');

  // 摘要相关状态
  const summaryLoading = ref(false);
  const summaryError = ref('');
  const currentSummary = ref('');
  const currentSummaryProperty = ref('');

  // ------- 派生状态 -------
  const hasSelectedSection = computed(
    () => selectedChapterIndex.value >= 0 && selectedSectionIndex.value >= 0,
  );

  const currentChapter = computed<Chapter | null>(() => {
    if (!selectedBook.value || selectedChapterIndex.value < 0) return null;
    return selectedBook.value.chapters[selectedChapterIndex.value] || null;
  });

  const currentSection = computed<Section | null>(() => {
    if (!currentChapter.value || selectedSectionIndex.value < 0) return null;
    return currentChapter.value.sections[selectedSectionIndex.value] || null;
  });

  // ------- 内部工具函数 -------
  const compareProperties = (propA: string, propB: string) => {
    if (propA === propB) return 0;
    if (!propA) return propB ? -1 : 0;
    if (!propB) return 1;

    const partsA = propA.split('.');
    const partsB = propB.split('.');
    const minLength = Math.min(partsA.length, partsB.length);

    for (let i = 0; i < minLength; i++) {
      try {
        const numA = parseInt(partsA[i]);
        const numB = parseInt(partsB[i]);

        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) return numA - numB;
        } else {
          const strComp = partsA[i].localeCompare(partsB[i]);
          if (strComp !== 0) return strComp;
        }
      } catch {
        const strComp = partsA[i].localeCompare(partsB[i]);
        if (strComp !== 0) return strComp;
      }
    }

    return partsA.length - partsB.length;
  };

  // ------- Actions：数据获取 -------

  /**
   * 根据 bookId 拉取该书籍下的所有 markdown 文件，并构建章节结构
   * 仅做公共能力封装，不涉及 BookViewer 的 UI 逻辑
   */
  const fetchAllMarkdownFiles = async (bookId: number) => {
    loading.value = true;
    error.value = '';

    try {
      const baseUrl = 'http://localhost:8080/api/files/markdown';
      const url = `${baseUrl}?bookId=${bookId}`;
      const response = await axios.get(url);

      interface MarkdownResponse {
        files?: MarkdownFile[];
        total?: number;
        error?: string;
      }

      const data = response.data as MarkdownResponse;

      if (!data || !data.files || data.files.length === 0) {
        error.value = '没有找到 Markdown 文件，请先上传文件';
        return false;
      }

      // 1. 预处理：补充 fileName
      const filesWithNames = data.files.map((file) => {
        const pathParts = file.file_path.split(/[\\/]/);
        const fileName = pathParts[pathParts.length - 1];
        return { ...file, fileName };
      });

      // 2. 根据 property 分组为章节
      const groupedFiles = filesWithNames.reduce(
        (groups: Record<string, MarkdownFile[]>, file) => {
          const property = file.property || 'other';
          const chapter = property.includes('.') ? property.split('.')[0] : property;

          if (!groups[chapter]) groups[chapter] = [];
          groups[chapter].push(file);
          return groups;
        },
        {},
      );

      // 3. 转为 Chapter 结构
      const markdownChapters: Chapter[] = Object.keys(groupedFiles)
        .sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        })
        .map((chapterKey) => {
          const files = groupedFiles[chapterKey];

          files.sort((a, b) => {
            const propA = a.property || '';
            const propB = b.property || '';
            return compareProperties(propA, propB);
          });

          return {
            chapter: chapterKey,
            title: `第${chapterKey}章`,
            expanded: false,
            sections: files.map((file) => {
              const fileName = file.fileName || '';
              const cleanedName = fileName.replace(/^\d+_/, '');
              const title = cleanedName.replace(/\.(md|markdown)$/i, '');

              return {
                title,
                pageNumber: 1,
                fileId: file.id,
              };
            }),
          };
        });

      // 4. 如果 selectedBook 还没设置，创建一个默认 Book
      if (!selectedBook.value) {
        selectedBook.value = {
          id: bookId,
          title: '地质科学文档库',
          author: '系统自动整理',
          coverUrl: '/书籍封面.jpg',
          chapters: markdownChapters,
        };
      } else {
        selectedBook.value = {
          ...selectedBook.value,
          chapters: markdownChapters,
        };
      }

      return true;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error ||
        `获取 Markdown 文件失败: ${err.message || String(err)}`;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const fetchFileToc = async (fileId: number) => {
    try {
      const url = `http://localhost:8080/api/files/markdown/${fileId}/toc`;
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      console.error(`获取文件 ID ${fileId} 的目录结构失败:`, err);
      return null;
    }
  };

  const fetchSectionContent = async (fileId: number): Promise<string | null> => {
    try {
      const url = `http://localhost:8080/api/files/markdown/${fileId}/content`;
      const response = await axios.get(url);
      const data = response.data as ContentResponse;

      if (data && data.content) {
        originalContent.value = data.content;
        return data.content;
      }

      return null;
    } catch (err) {
      console.error('获取章节内容失败:', err);
      return null;
    }
  };

  // ------- Actions：摘要 -------
  /**
   * 根据章节 / 小节编号获取摘要（property 如 "1"、"1.2"）
   */
  const fetchSummary = async (property: string) => {
    if (!property) {
      summaryError.value = '无效的章节编号';
      return;
    }

    const bookId =
      selectedBook.value && selectedBook.value.id
        ? Number(selectedBook.value.id)
        : 1;

    summaryLoading.value = true;
    summaryError.value = '';
    currentSummaryProperty.value = property;

    try {
      const url = `http://localhost:8080/api/files/summary/${property}?brief=false&autoGenerate=true&bookId=${bookId}`;
      const response = await axios.get(url);

      interface SummaryResponse {
        content?: string;
        error?: string;
        autoGenerated?: boolean;
      }

      const data = response.data as SummaryResponse;

      if (data && data.content) {
        currentSummary.value = data.content;
        if (data.autoGenerated) {
          summaryError.value = '注意：这是自动生成的摘要，可能不够准确。';
        }
      } else if (data && data.error) {
        summaryError.value = data.error;
        currentSummary.value = '';
      } else {
        summaryError.value = `章节 ${property} 暂无摘要信息`;
        currentSummary.value = '';
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        summaryError.value = `章节 ${property} 的摘要不存在，可能尚未生成`;
      } else {
        summaryError.value = `获取摘要失败: ${err.message || String(err)}`;
      }
      currentSummary.value = '';
    } finally {
      summaryLoading.value = false;
    }
  };

  // ------- Actions：选择/导航 -------
  const selectSection = (chapterIndex: number, sectionIndex: number) => {
    selectedChapterIndex.value = chapterIndex;
    selectedSectionIndex.value = sectionIndex;
  };

  const clearSelection = () => {
    selectedChapterIndex.value = -1;
    selectedSectionIndex.value = -1;
    originalContent.value = '';
  };

  return {
    // state
    selectedBook,
    selectedChapterIndex,
    selectedSectionIndex,
    loading,
    error,
    originalContent,
    summaryLoading,
    summaryError,
    currentSummary,
    currentSummaryProperty,

    // getters
    hasSelectedSection,
    currentChapter,
    currentSection,

    // actions
    fetchAllMarkdownFiles,
    fetchFileToc,
    fetchSectionContent,
    fetchSummary,
    selectSection,
    clearSelection,
  };
});


