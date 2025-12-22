# BookViewer 拆分重构 - 具体实现指南

## 一、第一步：创建共享状态管理

### 1.1 安装 Pinia（如果未安装）

```bash
npm install pinia
```

### 1.2 创建 Book Store

创建文件：`src/stores/bookStore.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// 类型定义（从 BookViewer.vue 迁移）
interface TocItem {
  level: number
  title: string
  numericPrefix: string
  id?: string
  isImage?: boolean
  parentSection?: string
}

interface Section {
  title: string
  pageNumber: number
  fileId?: number
  content?: string
  toc?: TocItem[]
  summary?: string
}

interface Chapter {
  title: string
  sections: Section[]
  expanded?: boolean
  chapter: string
}

interface Book {
  id: string
  title: string
  author: string
  coverUrl: string
  chapters: Chapter[]
}

interface SentenceItem {
  text: string
  isTarget: boolean
}

export const useBookStore = defineStore('book', () => {
  // 状态
  const selectedBook = ref<Book | null>(null)
  const selectedChapter = ref(-1)
  const selectedSection = ref(-1)
  const sectionImages = ref<any[]>([])
  const originalContent = ref('')
  const processedSentences = ref<SentenceItem[]>([])
  const highlightedSentences = ref<number[]>([])
  const loading = ref(false)
  const error = ref('')

  // Getters
  const hasSelectedSection = computed(() => 
    selectedChapter.value >= 0 && selectedSection.value >= 0
  )

  const currentSection = computed(() => {
    if (!selectedBook.value || selectedChapter.value < 0 || selectedSection.value < 0) {
      return null
    }
    return selectedBook.value.chapters[selectedChapter.value]
      .sections[selectedSection.value]
  })

  const currentChapter = computed(() => {
    if (!selectedBook.value || selectedChapter.value < 0) {
      return null
    }
    return selectedBook.value.chapters[selectedChapter.value]
  })

  // Actions
  async function fetchAllMarkdownFiles(bookId: number) {
    loading.value = true
    error.value = ''
    
    try {
      const url = `http://localhost:8080/api/files/markdown?bookId=${bookId}`
      const response = await axios.get(url)
      const data = response.data
      
      if (data && data.files && data.files.length > 0) {
        // 处理文件数据，转换为章节结构
        // ... (从 BookViewer.vue 迁移逻辑)
        return true
      } else {
        error.value = '没有找到 Markdown 文件'
        return false
      }
    } catch (err: any) {
      error.value = `获取 Markdown 文件失败: ${err.message}`
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchFileToc(fileId: number) {
    try {
      const url = `http://localhost:8080/api/files/markdown/${fileId}/toc`
      const response = await axios.get(url)
      return response.data
    } catch (err: any) {
      console.error(`获取文件目录失败:`, err)
      return null
    }
  }

  async function fetchSectionContent(fileId: number): Promise<string | null> {
    try {
      const url = `http://localhost:8080/api/files/markdown/${fileId}/content`
      const response = await axios.get(url)
      const data = response.data
      
      if (data && data.content) {
        return data.content
      }
      return null
    } catch (err: any) {
      console.error(`获取章节内容失败:`, err)
      return null
    }
  }

  async function fetchChapterImages(chapterNumber: string, bookId: number) {
    try {
      const url = `http://localhost:8080/api/files/chapter/${chapterNumber}/images?bookId=${bookId}`
      const response = await axios.get(url)
      const data = response.data
      
      if (data && data.images && Array.isArray(data.images)) {
        sectionImages.value = data.images
        return data.images
      }
      return []
    } catch (err: any) {
      console.error(`获取图片列表失败:`, err)
      sectionImages.value = []
      return []
    }
  }

  function selectSection(chapterIndex: number, sectionIndex: number) {
    selectedChapter.value = chapterIndex
    selectedSection.value = sectionIndex
  }

  function clearSelection() {
    selectedChapter.value = -1
    selectedSection.value = -1
    originalContent.value = ''
    processedSentences.value = []
    highlightedSentences.value = []
  }

  return {
    // State
    selectedBook,
    selectedChapter,
    selectedSection,
    sectionImages,
    originalContent,
    processedSentences,
    highlightedSentences,
    loading,
    error,
    
    // Getters
    hasSelectedSection,
    currentSection,
    currentChapter,
    
    // Actions
    fetchAllMarkdownFiles,
    fetchFileToc,
    fetchSectionContent,
    fetchChapterImages,
    selectSection,
    clearSelection,
  }
})
```

### 1.3 在 main.ts 中注册 Pinia

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

## 二、第二步：创建工具函数文件

创建文件：`src/utils/bookUtils.ts`

```typescript
import axios from 'axios'

// 比较属性字符串（如 "4.2" 和 "4.10"）
export function compareProperties(propA: string, propB: string): number {
  if (propA === propB) return 0
  if (!propA) return propB ? -1 : 0
  if (!propB) return 1
  
  const partsA = propA.split('.')
  const partsB = propB.split('.')
  const minLength = Math.min(partsA.length, partsB.length)
  
  for (let i = 0; i < minLength; i++) {
    try {
      const numA = parseInt(partsA[i])
      const numB = parseInt(partsB[i])
      
      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA !== numB) {
          return numA - numB
        }
      } else {
        const strComp = partsA[i].localeCompare(partsB[i])
        if (strComp !== 0) {
          return strComp
        }
      }
    } catch (e) {
      const strComp = partsA[i].localeCompare(partsB[i])
      if (strComp !== 0) {
        return strComp
      }
    }
  }
  
  return partsA.length - partsB.length
}

// 从图片标题中提取图片编号
export function extractFigureNumber(title: string): string | null {
  const patterns = [
    /图\s*(\d+(?:\.\d+)*)/,
    /如图\s*(\d+(?:\.\d+)*)/,
    /图\s*(\d+(?:\.\d+)*)\s*[:：]/
  ]
  
  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

// 处理 API 错误
export function handleApiError(err: any, message: string): string {
  if (err.response) {
    return `${message}: 服务器返回 ${err.response.status} - ${err.response.data.error || '未知错误'}`
  } else if (err.request) {
    return `${message}: 服务器未响应，请检查后端服务是否运行`
  } else {
    return `${message}: ${err.message}`
  }
}
```

## 三、第三步：创建书籍目录组件

创建文件：`src/components/BookViewer/BookCatalog/BookCatalog.vue`

```vue
<template>
  <div class="book-catalog">
    <div class="catalog-header">
      <h4>书籍目录</h4>
      <div class="catalog-actions">
        <button 
          class="detailed-toc-btn" 
          @click="generateDetailedToc" 
          title="生成超细化目录"
          v-if="bookStore.selectedBook && bookStore.selectedBook.chapters.length > 0"
        >
          <span class="btn-icon">⚡</span>
          <span class="btn-text">超细化目录</span>
        </button>
        <button 
          class="export-toc-btn" 
          @click="exportToc" 
          title="导出目录"
          v-if="bookStore.selectedBook && bookStore.selectedBook.chapters.length > 0"
        >
          <span class="btn-icon">↓</span>
          <span class="btn-text">导出目录</span>
        </button>
      </div>
    </div>
    
    <div v-if="bookStore.loading" class="loading-indicator">
      <p>正在加载目录...</p>
    </div>
    
    <div v-else-if="bookStore.error" class="error-message">
      <p>{{ bookStore.error }}</p>
    </div>
    
    <div v-else-if="bookStore.selectedBook" class="book-toc">
      <ChapterTree 
        :chapters="bookStore.selectedBook.chapters"
        :expanded-chapters="expandedChapters"
        @toggle-chapter="toggleChapter"
        @select-section="handleSelectSection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBookStore } from '@/stores/bookStore'
import ChapterTree from './ChapterTree.vue'

const bookStore = useBookStore()

const expandedChapters = ref<Record<number, boolean>>({})

const toggleChapter = (index: number) => {
  expandedChapters.value[index] = !expandedChapters.value[index]
}

const handleSelectSection = async (chapterIndex: number, sectionIndex: number) => {
  bookStore.selectSection(chapterIndex, sectionIndex)
  
  const section = bookStore.currentSection
  if (section && section.fileId && !section.toc) {
    const result = await bookStore.fetchFileToc(section.fileId)
    if (result && result.toc) {
      // 更新小节的目录数据
      if (bookStore.selectedBook) {
        bookStore.selectedBook.chapters[chapterIndex].sections[sectionIndex].toc = result.toc
      }
    }
  }
  
  // 触发事件，通知父组件
  emit('section-selected', { chapterIndex, sectionIndex })
}

const generateDetailedToc = () => {
  // 实现超细化目录生成逻辑
  emit('generate-detailed-toc')
}

const exportToc = () => {
  // 实现目录导出逻辑
  emit('export-toc')
}

const emit = defineEmits<{
  (e: 'section-selected', payload: { chapterIndex: number, sectionIndex: number }): void
  (e: 'generate-detailed-toc'): void
  (e: 'export-toc'): void
}>()
</script>

<style scoped>
.book-catalog {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 2px solid #e5e7eb;
}

.catalog-actions {
  display: flex;
  gap: 10px;
}

/* 其他样式从 BookViewer.vue 迁移 */
</style>
```

## 四、第四步：创建图目录组件

创建文件：`src/components/BookViewer/FigureCatalog/FigureCatalog.vue`

```vue
<template>
  <div class="figure-catalog">
    <div v-if="loading" class="loading-indicator">
      <p>正在加载图片列表...</p>
    </div>
    
    <div v-else-if="images.length === 0" class="no-images-message">
      <p>该章节暂无图片</p>
    </div>
    
    <ul v-else class="figure-list">
      <li 
        v-for="item in images" 
        :key="item.id || item.title"
        @click="selectFigure(item)"
        :class="{ active: selectedFigureTitle === item.title }"
        @mouseover="hoveredFigureTitle = item.title"
        @mouseleave="hoveredFigureTitle = ''"
      >
        <span class="figure-icon">🖼️</span>
        <span class="figure-title-text">{{ item.title }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBookStore } from '@/stores/bookStore'
import axios from 'axios'

const props = defineProps<{
  bookId: number
  chapterNumber?: string
}>()

const emit = defineEmits<{
  (e: 'figure-selected', figure: any): void
}>()

const bookStore = useBookStore()
const loading = ref(false)
const images = ref<any[]>([])
const selectedFigureTitle = ref('')
const hoveredFigureTitle = ref('')

// 监听章节变化，获取图片列表
watch(
  [() => bookStore.selectedChapter, () => bookStore.selectedSection],
  async ([chapterIdx, sectionIdx]) => {
    if (chapterIdx >= 0 && sectionIdx >= 0 && bookStore.selectedBook) {
      const section = bookStore.selectedBook.chapters[chapterIdx].sections[sectionIdx]
      const match = section.title.match(/^(\d+(?:\.\d+)*)(\s|$)/)
      const chapterNo = match ? match[1] : ''
      
      if (chapterNo) {
        await fetchImages(chapterNo)
      }
    }
  },
  { immediate: true }
)

const fetchImages = async (chapterNumber: string) => {
  loading.value = true
  try {
    const bookId = props.bookId || (bookStore.selectedBook 
      ? (typeof bookStore.selectedBook.id === 'string' 
        ? parseInt(bookStore.selectedBook.id) 
        : bookStore.selectedBook.id) 
      : 1)
    
    const res = await axios.get(
      `http://localhost:8080/api/files/chapter/${chapterNumber}/images?bookId=${bookId}`
    )
    const data = res.data
    
    if (data && data.images && Array.isArray(data.images)) {
      images.value = data.images.filter(img => {
        const name = img.name || ''
        const url = img.url || ''
        return /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(name) || 
               /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(url)
      })
    } else {
      images.value = []
    }
  } catch (e) {
    console.error('获取图片列表失败:', e)
    images.value = []
  } finally {
    loading.value = false
  }
}

const selectFigure = (item: any) => {
  selectedFigureTitle.value = item.title
  emit('figure-selected', item)
}
</script>

<style scoped>
.figure-catalog {
  height: 100%;
  overflow-y: auto;
}

.figure-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.figure-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 6px;
}

.figure-list li:hover {
  background-color: #f0faff;
}

.figure-list li.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
  padding-left: 11px;
}

.figure-icon {
  margin-right: 8px;
  font-size: 14px;
}

.figure-title-text {
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}
</style>
```

## 五、第五步：创建独立页面示例

创建文件：`src/views/FigureCatalogPage.vue`

```vue
<template>
  <div class="figure-catalog-page">
    <div class="page-header">
      <h2>图目录</h2>
      <button class="back-btn" @click="goBack">返回</button>
    </div>
    
    <div class="page-content">
      <!-- 左侧：图目录列表 -->
      <div class="left-panel">
        <FigureCatalog 
          :book-id="bookId"
          @figure-selected="handleFigureSelected"
        />
      </div>
      
      <!-- 中间：图片预览 -->
      <div class="center-panel">
        <FigurePreview 
          v-if="selectedFigure"
          :figure="selectedFigure"
        />
        <div v-else class="placeholder">
          请选择图片查看预览
        </div>
      </div>
      
      <!-- 右侧：详情面板 -->
      <div class="right-panel">
        <SectionDetail 
          v-if="bookStore.hasSelectedSection"
        />
        <div v-else class="placeholder">
          请选择章节查看详情
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBookStore } from '@/stores/bookStore'
import FigureCatalog from '@/components/BookViewer/FigureCatalog/FigureCatalog.vue'
import FigurePreview from '@/components/BookViewer/PreviewPanel/FigurePreview.vue'
import SectionDetail from '@/components/BookViewer/DetailPanel/SectionDetail.vue'

const router = useRouter()
const route = useRoute()
const bookStore = useBookStore()

const bookId = ref<number>(1)
const selectedFigure = ref<any>(null)

onMounted(() => {
  // 从路由参数获取 bookId
  if (route.params.bookId) {
    bookId.value = parseInt(route.params.bookId as string)
  }
  
  // 加载书籍数据
  if (bookId.value) {
    bookStore.fetchAllMarkdownFiles(bookId.value)
  }
})

const handleFigureSelected = (figure: any) => {
  selectedFigure.value = figure
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.figure-catalog-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.page-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  flex: 0 0 30%;
  min-width: 320px;
  max-width: 450px;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}

.center-panel {
  flex: 0 0 35%;
  min-width: 350px;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}

.right-panel {
  flex: 1;
  min-width: 400px;
  overflow-y: auto;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}
</style>
```

## 六、更新路由配置

在路由文件中添加：

```typescript
{
  path: '/figure-catalog/:bookId?',
  name: 'FigureCatalog',
  component: () => import('@/views/FigureCatalogPage.vue'),
  meta: { title: '图目录' }
}
```

## 七、更新 HomePage.vue 导航

```typescript
const navigateToFigureCatalog = () => {
  router.push('/figure-catalog')
}
```

## 八、迁移步骤总结

1. ✅ 创建共享状态管理（Pinia Store）
2. ✅ 提取工具函数
3. ✅ 创建基础组件（BookCatalog, FigureCatalog 等）
4. ✅ 创建预览组件（FigurePreview, TablePreview 等）
5. ✅ 创建详情组件（SectionDetail, OriginalContent 等）
6. ✅ 创建独立页面（FigureCatalogPage 等）
7. ✅ 更新路由配置
8. ✅ 更新导航链接
9. ✅ 测试功能
10. ✅ 优化性能

## 九、注意事项

1. **渐进式迁移**：不要一次性替换所有代码，逐步迁移
2. **保持兼容**：确保现有 BookViewer 仍可使用
3. **测试充分**：每个组件都要单独测试
4. **文档更新**：更新相关文档说明新的使用方式

