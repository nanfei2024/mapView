# BookViewer 组件拆分重构方案

## 一、当前功能模块分析

### 1.1 BookViewer.vue 当前包含的功能

#### 左侧目录区域（catalog-area）
- **书籍目录（book tab）**：章节结构展示、目录展开/折叠、摘要查看、超细化目录生成、目录导出
- **图目录（figure tab）**：图片列表展示、图片选择
- **表目录（table tab）**：表格列表展示、表格选择
- **引文目录（citation tab）**：引文列表展示（使用 CitationViewer 组件）

#### 中间预览区域（center-area）
- **图片预览**：图片显示、图片上下文展示、高亮句子
- **表格预览**：表格 HTML 展示
- **引文预览**：引文内容展示、上下文展示

#### 右侧详情区域（right-area）
- **章节详情**：章节内容、原文查看、高亮管理、导航
- **摘要显示**：章节摘要展示

### 1.2 共享的数据和状态

- `selectedBook`: 当前选中的书籍
- `selectedChapter`: 当前选中的章节索引
- `selectedSection`: 当前选中的小节索引
- `sectionImages`: 章节图片列表
- `originalContent`: 原文内容
- `processedSentences`: 处理后的句子数组
- `highlightedSentences`: 高亮的句子索引

## 二、拆分方案

### 2.1 组件拆分结构

```
components/
├── BookViewer/                    # 主容器组件（保留，但简化）
│   ├── BookViewer.vue            # 主容器，负责布局和状态协调
│   ├── BookCatalog/               # 书籍目录模块
│   │   ├── BookCatalog.vue       # 书籍目录主组件
│   │   ├── ChapterTree.vue      # 章节树组件
│   │   ├── SectionList.vue      # 小节列表组件
│   │   └── TocActions.vue       # 目录操作组件（生成、导出）
│   ├── FigureCatalog/            # 图目录模块
│   │   ├── FigureCatalog.vue    # 图目录主组件
│   │   └── FigureList.vue       # 图片列表组件
│   ├── TableCatalog/              # 表目录模块
│   │   ├── TableCatalog.vue     # 表目录主组件
│   │   └── TableList.vue         # 表格列表组件
│   ├── CitationCatalog/           # 引文目录模块
│   │   └── CitationCatalog.vue  # 引文目录组件（使用现有 CitationViewer）
│   ├── PreviewPanel/              # 预览面板模块
│   │   ├── FigurePreview.vue     # 图片预览组件
│   │   ├── TablePreview.vue      # 表格预览组件
│   │   └── CitationPreview.vue   # 引文预览组件
│   └── DetailPanel/               # 详情面板模块
│       ├── SectionDetail.vue      # 章节详情组件
│       ├── OriginalContent.vue     # 原文内容组件
│       └── SummaryPanel.vue       # 摘要面板组件
```

### 2.2 页面拆分结构（独立页面方案）

```
views/
├── BookCatalogPage.vue           # 书籍目录页面
├── FigureCatalogPage.vue         # 图目录页面
├── TableCatalogPage.vue          # 表目录页面
└── CitationCatalogPage.vue       # 引文目录页面
```

## 三、推荐方案：混合方案

### 3.1 方案说明

采用**组件拆分 + 独立页面**的混合方案：
- **组件拆分**：将 BookViewer 拆分为多个独立的功能组件
- **独立页面**：每个目录类型对应一个独立页面，但共享组件
- **状态管理**：使用 Pinia/Vuex 或 Props/Events 管理共享状态

### 3.2 优势

1. **模块化**：每个功能独立，便于维护和测试
2. **可复用**：组件可以在不同页面复用
3. **灵活性**：可以单独访问某个目录页面，也可以组合使用
4. **渐进式重构**：可以逐步迁移，不影响现有功能

## 四、重构流程

### 阶段一：组件拆分（基础准备）

#### 步骤 1.1：创建共享状态管理
- 创建 `stores/bookStore.ts`（使用 Pinia）或 `composables/useBookState.ts`
- 管理书籍、章节、小节等共享状态

#### 步骤 1.2：提取公共工具函数
- 创建 `utils/bookUtils.ts`
- 提取 `fetchAllMarkdownFiles`、`fetchFileToc`、`fetchSectionContent` 等 API 调用
- 提取 `compareProperties`、`extractFigureNumber` 等工具函数

#### 步骤 1.3：创建基础组件
- `BookCatalog.vue`：书籍目录组件
- `FigureCatalog.vue`：图目录组件
- `TableCatalog.vue`：表目录组件
- `CitationCatalog.vue`：引文目录组件（包装现有 CitationViewer）

### 阶段二：预览和详情组件拆分

#### 步骤 2.1：创建预览组件
- `FigurePreview.vue`：图片预览（包含上下文）
- `TablePreview.vue`：表格预览
- `CitationPreview.vue`：引文预览

#### 步骤 2.2：创建详情组件
- `SectionDetail.vue`：章节详情
- `OriginalContent.vue`：原文内容（包含高亮功能）
- `SummaryPanel.vue`：摘要面板

### 阶段三：创建独立页面

#### 步骤 3.1：创建页面组件
- `BookCatalogPage.vue`：书籍目录页面（左侧目录 + 右侧详情）
- `FigureCatalogPage.vue`：图目录页面（左侧列表 + 中间预览 + 右侧详情）
- `TableCatalogPage.vue`：表目录页面（左侧列表 + 中间预览 + 右侧详情）
- `CitationCatalogPage.vue`：引文目录页面（左侧列表 + 中间预览 + 右侧详情）

#### 步骤 3.2：更新路由配置
- 添加新路由：`/book-catalog`、`/figure-catalog`、`/table-catalog`、`/citation-catalog`
- 更新 HomePage.vue 中的导航链接

### 阶段四：重构 BookViewer（可选）

#### 步骤 4.1：简化 BookViewer
- BookViewer 作为容器组件，使用拆分后的子组件
- 保留三栏布局，但功能由子组件实现

#### 步骤 4.2：迁移现有功能
- 逐步将 BookViewer 中的功能迁移到对应组件
- 确保功能完整性

### 阶段五：测试和优化

#### 步骤 5.1：功能测试
- 测试每个独立页面的功能
- 测试组件间的数据传递
- 测试状态同步

#### 步骤 5.2：性能优化
- 优化组件加载
- 优化数据获取
- 添加缓存机制

## 五、技术实现细节

### 5.1 状态管理方案

#### 方案 A：Pinia Store（推荐）

```typescript
// stores/bookStore.ts
import { defineStore } from 'pinia'

export const useBookStore = defineStore('book', {
  state: () => ({
    selectedBook: null as Book | null,
    selectedChapter: -1,
    selectedSection: -1,
    sectionImages: [] as any[],
    originalContent: '',
    processedSentences: [] as SentenceItem[],
    highlightedSentences: [] as number[],
  }),
  
  getters: {
    hasSelectedSection: (state) => 
      state.selectedChapter >= 0 && state.selectedSection >= 0,
    
    currentSection: (state) => {
      if (!state.selectedBook || state.selectedChapter < 0 || state.selectedSection < 0) {
        return null
      }
      return state.selectedBook.chapters[state.selectedChapter]
        .sections[state.selectedSection]
    }
  },
  
  actions: {
    async fetchAllMarkdownFiles(bookId: number) { /* ... */ },
    async fetchFileToc(fileId: number) { /* ... */ },
    async fetchSectionContent(fileId: number) { /* ... */ },
    // ... 其他 actions
  }
})
```

#### 方案 B：Composables（轻量级）

```typescript
// composables/useBookState.ts
import { ref, computed } from 'vue'

export function useBookState() {
  const selectedBook = ref<Book | null>(null)
  const selectedChapter = ref(-1)
  const selectedSection = ref(-1)
  // ... 其他状态
  
  const hasSelectedSection = computed(() => 
    selectedChapter.value >= 0 && selectedSection.value >= 0
  )
  
  // ... 其他逻辑
  
  return {
    selectedBook,
    selectedChapter,
    selectedSection,
    hasSelectedSection,
    // ... 其他返回值
  }
}
```

### 5.2 组件通信方案

#### Props + Events（推荐用于父子组件）
```vue
<!-- 父组件 -->
<FigureCatalog 
  :book-id="bookId"
  :chapter-number="chapterNumber"
  @figure-selected="handleFigureSelected"
/>

<!-- 子组件 -->
<script setup lang="ts">
defineProps<{
  bookId: number
  chapterNumber: string
}>()

const emit = defineEmits<{
  (e: 'figure-selected', figure: any): void
}>()
</script>
```

#### Provide/Inject（用于深层组件）
```vue
<!-- 父组件 -->
<script setup lang="ts">
import { provide } from 'vue'
import { useBookStore } from '@/stores/bookStore'

const bookStore = useBookStore()
provide('bookStore', bookStore)
</script>

<!-- 子组件 -->
<script setup lang="ts">
import { inject } from 'vue'

const bookStore = inject('bookStore')
</script>
```

### 5.3 路由配置示例

```typescript
// router/index.ts
{
  path: '/book-catalog',
  name: 'BookCatalog',
  component: () => import('@/views/BookCatalogPage.vue'),
  meta: { title: '书籍目录' }
},
{
  path: '/figure-catalog',
  name: 'FigureCatalog',
  component: () => import('@/views/FigureCatalogPage.vue'),
  meta: { title: '图目录' }
},
{
  path: '/table-catalog',
  name: 'TableCatalog',
  component: () => import('@/views/TableCatalogPage.vue'),
  meta: { title: '表目录' }
},
{
  path: '/citation-catalog',
  name: 'CitationCatalog',
  component: () => import('@/views/CitationCatalogPage.vue'),
  meta: { title: '引文目录' }
}
```

## 六、迁移检查清单

### 6.1 功能迁移检查

- [ ] 书籍目录功能
  - [ ] 章节树展示
  - [ ] 目录展开/折叠
  - [ ] 摘要查看
  - [ ] 超细化目录生成
  - [ ] 目录导出
  
- [ ] 图目录功能
  - [ ] 图片列表展示
  - [ ] 图片选择
  - [ ] 图片预览
  - [ ] 图片上下文
  
- [ ] 表目录功能
  - [ ] 表格列表展示
  - [ ] 表格选择
  - [ ] 表格预览
  
- [ ] 引文目录功能
  - [ ] 引文列表展示
  - [ ] 引文选择
  - [ ] 引文预览
  - [ ] 引文跳转原文
  
- [ ] 详情面板功能
  - [ ] 章节详情展示
  - [ ] 原文查看
  - [ ] 高亮管理
  - [ ] 导航功能

### 6.2 数据流检查

- [ ] 书籍数据获取
- [ ] 章节数据获取
- [ ] 图片数据获取
- [ ] 表格数据获取
- [ ] 引文数据获取
- [ ] 原文内容获取
- [ ] 摘要数据获取

### 6.3 UI/UX 检查

- [ ] 布局一致性
- [ ] 交互一致性
- [ ] 样式一致性
- [ ] 响应式设计
- [ ] 加载状态
- [ ] 错误处理

## 七、注意事项

1. **向后兼容**：确保现有 BookViewer 的使用不受影响
2. **性能优化**：避免重复数据获取，使用缓存
3. **错误处理**：统一的错误处理机制
4. **类型安全**：使用 TypeScript 确保类型安全
5. **测试覆盖**：为每个组件编写单元测试

## 八、时间估算

- **阶段一**：2-3 天（组件拆分和工具提取）
- **阶段二**：2-3 天（预览和详情组件）
- **阶段三**：2-3 天（独立页面创建）
- **阶段四**：1-2 天（BookViewer 重构）
- **阶段五**：2-3 天（测试和优化）

**总计**：9-14 天

## 九、下一步行动

1. 确认拆分方案
2. 创建项目任务清单
3. 开始阶段一：组件拆分
4. 逐步迁移功能
5. 持续测试和优化

