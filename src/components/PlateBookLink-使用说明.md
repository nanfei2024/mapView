# PlateBookLink 组件使用说明

## 功能概述

PlateBookLink 组件用于显示板块与书籍章节的关联关系，支持：
- 二级板块和三级板块分组显示
- 可折叠/展开的分组和板块
- 点击章节跳转到对应的markdown文件

## 集成步骤

### 1. 在父组件中监听事件

```vue
<template>
  <PlateBookLink @open-chapter="handleOpenChapter" />
</template>

<script setup lang="ts">
import PlateBookLink from '@/components/PlateBookLink.vue';

// 定义章节接口
interface Chapter {
  title: string;
  path: string;
  fileId?: number;
  markdownUrl?: string;
}

// 处理打开章节事件
const handleOpenChapter = (chapter: Chapter, content: string) => {
  console.log('打开章节:', chapter);
  console.log('Markdown内容:', content);
  
  // 这里可以：
  // 1. 打开书籍查看器组件
  // 2. 在新窗口显示内容
  // 3. 在侧边栏显示内容
  // 4. 其他自定义操作
};
</script>
```

### 2. 与BookViewer集成示例

```vue
<template>
  <div>
    <PlateBookLink @open-chapter="handleOpenChapter" />
    
    <!-- 书籍查看器 -->
    <BookViewer 
      v-if="showViewer"
      :content="currentContent"
      :chapter="currentChapter"
      @close="showViewer = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PlateBookLink from '@/components/PlateBookLink.vue';
import BookViewer from '@/components/BookViewer.vue';

const showViewer = ref(false);
const currentContent = ref('');
const currentChapter = ref(null);

const handleOpenChapter = (chapter: Chapter, content: string) => {
  currentChapter.value = chapter;
  currentContent.value = content;
  showViewer.value = true;
};
</script>
```

## API说明

### Events

#### open-chapter
当用户点击章节的"跳转"按钮时触发

**参数：**
- `chapter: Chapter` - 章节信息对象
  - `title: string` - 章节标题
  - `path: string` - 章节路径
  - `fileId?: number` - 文件ID（用于获取markdown内容）
  - `markdownUrl?: string` - Markdown文件URL
- `content: string` - 从API获取的markdown内容

## 数据结构

### 板块数据示例

```typescript
{
  plateName: '华北',
  plateCode: 'HB',
  level: 2,  // 2=二级板块, 3=三级板块
  chapters: [
    {
      title: '4.3',
      path: '/books/geology/4.3.md',
      fileId: 123  // 必须提供fileId才能跳转
    }
  ]
}
```

## 注意事项

1. **fileId 必填**：章节必须有 `fileId` 才能跳转，否则会显示错误提示
2. **API依赖**：组件使用 `@/api/documentApi.ts` 中的 `getMarkdownContent` 方法
3. **错误处理**：加载失败时会显示错误消息，3秒后自动消失
4. **加载状态**：点击跳转按钮时会显示"加载中..."状态

## 后端API要求

需要实现以下API接口：

```
GET /api/documents/{documentId}/markdown
```

**响应格式：**
```json
{
  "success": true,
  "data": {
    "content": "# Markdown内容\n\n..."
  }
}
```

## 样式定制

组件使用scoped样式，如需自定义样式，可以通过以下方式：

```vue
<style>
/* 覆盖跳转按钮样式 */
.plate-book-link .jump-btn {
  background: #your-color;
}
</style>
```
