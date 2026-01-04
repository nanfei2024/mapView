<template>
    <div class="book-viewer-container">
      <!-- 顶部书籍封面和信息区 -->
      <div class="book-viewer-header">
        <img v-if="selectedBook && selectedBook.coverUrl" :src="selectedBook.coverUrl" :alt="selectedBook.title" class="book-cover-img" />
        <div class="book-details">
          <div class="book-title">{{ selectedBook?.title }}</div>
          <div class="book-author">作者: {{ selectedBook?.author }}</div>
          <div class="book-description" v-if="selectedBook?.id === '1'">
            这是一个自动生成的 Markdown 文档集合，包含了系统中所有的 Markdown 文件。文件按照章节属性进行分组，您可以通过左侧目录浏览所有文件。
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="fetchAllMarkdownFiles" title="刷新目录">
            <span>🔄</span>
          </button>
          <button class="action-btn" @click="generateAllSummaries" title="生成所有摘要">
            <span>📝</span>
          </button>
          <button class="close-btn" @click="closeViewer">返回书籍列表</button>
        </div>
      </div>
      <div class="book-viewer-bottom">
        <div class="catalog-area">
          <div class="catalog-tabs">
            <button :class="{active: catalogTab==='book'}" @click="catalogTab='book'">书籍目录</button>
            <button :class="{active: catalogTab==='figure'}" @click="catalogTab='figure'">图目录</button>
            <button :class="{active: catalogTab==='table'}" @click="catalogTab='table'">表目录</button>
            <button :class="{active: catalogTab==='citation'}" @click="catalogTab='citation'">引文目录</button>
          </div>
          <div class="catalog-content">
            <template v-if="catalogTab==='book'">
              <div class="book-toc-section">
                <div class="toc-header">
                  <h4>书籍目录</h4>
                  <div class="toc-actions">
                    <button 
                      class="detailed-toc-btn" 
                      @click="generateDetailedToc" 
                      title="生成超细化目录"
                      v-if="selectedBook && selectedBook.chapters && selectedBook.chapters.length > 0"
                    >
                      <span class="btn-icon">⚡</span>
                      <span class="btn-text">超细化目录</span>
                    </button>
                    <button 
                      class="export-toc-btn" 
                      @click="exportToc" 
                      title="导出目录"
                      v-if="selectedBook && selectedBook.chapters && selectedBook.chapters.length > 0"
                    >
                      <span class="btn-icon">↓</span>
                      <span class="btn-text">导出目录</span>
                    </button>
                  </div>
                </div>
                <div v-if="loading" class="loading-indicator">
                  <p>正在加载目录...</p>
                </div>
                <div v-else-if="error" class="error-message">
                  <p>{{ error }}</p>
                </div>
                <div v-else-if="selectedBook" class="book-toc">
                  <ul>
                    <li v-for="(chapter, index) in selectedBook.chapters" :key="index">
                      <div 
                        class="chapter-title" 
                        @click="toggleChapter(index)"
                        :class="{ 'active': expandedChapters[index] }"
                      >
                        {{ chapter.title }}
                        <span class="toggle-icon">{{ expandedChapters[index] ? '▼' : '▶' }}</span>
                      </div>
                      <ul v-if="expandedChapters[index]" class="chapter-sections">
                        <li 
                          v-for="(section, sectionIndex) in chapter.sections" 
                          :key="sectionIndex"
                          :class="{ 'active': selectedChapter === index && selectedSection === sectionIndex }"
                        >
                          <div class="section-title-wrapper">
                            <div class="section-title-content" @click="toggleSection(index, sectionIndex, $event)">
                              {{ section.title }}
                              <span class="toggle-icon small" v-if="section.toc && section.toc.filter(item => !item.isImage && !/^图|^表/.test(item.title)).length > 0">
                                {{ isSectionExpanded(index, sectionIndex) ? '▼' : '▶' }}
                              </span>
                            </div>
                            <button 
                              class="summary-btn" 
                              @click.stop="fetchSummary(section.title.split(' ')[0])"
                              title="查看摘要"
                            >
                              <span>📝</span>
                            </button>
                          </div>
                          <!-- 只显示非图/表的子目录 -->
                          <ul v-if="section.toc && isSectionExpanded(index, sectionIndex)" class="section-subsections">
                            <li v-for="(tocItem, itemIndex) in section.toc.filter(item => !item.isImage && !/^图|^表/.test(item.title))" :key="itemIndex">
                              <div class="subsection-title">
                                <div class="subsection-title-content" @click.stop="toggleSubsection(index, sectionIndex, itemIndex)">
                                  <span v-if="tocItem.numericPrefix" class="toc-prefix">{{ tocItem.numericPrefix }}</span>
                                  <span class="toc-title">{{ tocItem.title }}</span>
                                  <span v-if="hasChildren(section.toc, itemIndex)" class="toggle-icon small">
                                    {{ isSubsectionExpanded(index, sectionIndex, itemIndex) ? '▼' : '▶' }}
                                  </span>
                                </div>
                                <button 
                                  class="summary-btn small" 
                                  @click.stop="fetchSummary(tocItem.numericPrefix)"
                                  title="查看摘要"
                                >
                                  <span>📝</span>
                                </button>
                              </div>
                              <!-- 子目录的子目录 -->
                              <ul 
                                v-if="hasChildren(section.toc, itemIndex) && isSubsectionExpanded(index, sectionIndex, itemIndex)" 
                                class="subsection-children"
                              >
                                <li v-for="(childItem, childIndex) in getChildren(section.toc || [], section.toc ? section.toc.indexOf(tocItem) : -1)" :key="childIndex">
                                  <div class="subsection-title">
                                    <div class="subsection-title-content" @click.stop>
                                      <span v-if="childItem.numericPrefix" class="toc-prefix">{{ childItem.numericPrefix }}</span>
                                      <span class="toc-title">{{ childItem.title }}</span>
                                    </div>
                                    <button 
                                      class="summary-btn small" 
                                      @click.stop="fetchSummary(childItem.numericPrefix)"
                                      title="查看摘要"
                                    >
                                      <span>📝</span>
                                    </button>
                                  </div>
                                </li>
                              </ul>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </template>
            <template v-else-if="catalogTab==='figure'">
              <div v-if="imagesLoading" class="loading-indicator">
                <p>正在加载图片列表...</p>
              </div>
              <div v-else-if="figureCatalog.length === 0" class="no-images-message">
                <p>该章节暂无图片</p>
              </div>
              <ul v-else>
                <li v-for="item in figureCatalog" :key="item.id || item.title"
                    @click="selectFigure(item)"
                    :class="{active: centerFigureUrl && item.title === selectedFigureTitle}"
                    @mouseover="hoveredFigureTitle = item.title"
                    @mouseleave="hoveredFigureTitle = ''"
                    :style="{
                      cursor: 'pointer',
                      background: (centerFigureUrl && item.title === selectedFigureTitle) ? '#e6f7ff' : (hoveredFigureTitle === item.title ? '#f0faff' : ''),
                      color: (centerFigureUrl && item.title === selectedFigureTitle) ? '#1890ff' : (hoveredFigureTitle === item.title ? '#1890ff' : ''),
                      fontWeight: (centerFigureUrl && item.title === selectedFigureTitle) ? 'bold' : 'normal',
                      borderRadius: '6px',
                      transition: 'all 0.2s',
                      marginBottom: '2px',
                      padding: '6px 8px'
                    }"
                >
                  <span class="figure-icon">🖼️</span>
                  <span class="figure-title-text">{{ item.title }}</span>
                </li>
              </ul>
            </template>
            <template v-else-if="catalogTab==='table'">
              <ul>
                <li v-for="item in tableCatalog" :key="item.id || item.title" @click="selectTable(item)">
                  {{ item.title }}
                </li>
              </ul>
            </template>
            <template v-else-if="catalogTab==='citation'">
              <CitationViewer
                v-if="hasSelectedSection && selectedBook"
                :file-id="selectedBook.chapters[selectedChapter].sections[selectedSection].fileId"
                :chapter-number="selectedBook.chapters[selectedChapter].sections[selectedSection].title.split(' ')[0]"
                :book-id="props.book ? (typeof props.book.id === 'string' ? parseInt(props.book.id) : props.book.id) : 1"
                @citation-selected="onCitationSelected"
                @reference-clicked="onReferenceClicked"
              />
              <div v-else class="no-section-selected">
                <p>请从左侧目录选择一个章节查看引文</p>
              </div>
            </template>
          </div>
        </div>
        <div class="center-area">
          <div v-if="centerType==='figure'" class="figure-preview-panel">
            <div v-if="centerFigureUrl" class="figure-img-wrapper">
              <img :src="centerFigureUrl" alt="图预览" class="figure-img" />
            </div>
            <div v-if="figureContextSectionTitle || figureContextText" class="figure-context-card">
              <div v-if="figureContextSectionTitle" class="context-section-title">
                【所在小节】: {{ figureContextSectionTitle }}
              </div>
              <div v-if="figureContextText" class="context-text">
                <span
                  v-for="idx in highlightedSentences"
                  :key="idx"
                  class="highlighted-sentence clickable"
                  @click="scrollToOriginal(idx)"
                >{{ processedSentences[idx].text }}</span>
              </div>
            </div>
            <div v-else-if="!centerFigureUrl" class="center-placeholder">请选择图目录项</div>
          </div>
          <div v-else-if="centerType==='table'">
            <div v-if="centerTableHtml" v-html="centerTableHtml"></div>
            <div v-else class="center-placeholder">请选择表目录项</div>
          </div>
          <div v-else-if="centerType==='citation'" class="citation-preview-panel">
            <div v-if="selectedCitationContent" class="citation-content-wrapper">
              <div class="citation-text-display">{{ selectedCitationContent.text }}</div>
              <div v-if="selectedCitationContent.context" class="citation-context">
                <h5>上下文：</h5>
                <p>{{ selectedCitationContent.context }}</p>
              </div>
            </div>
            <div v-else class="center-placeholder">请选择引文目录项</div>
          </div>
          <div v-else class="center-placeholder">请选择目录项</div>
        </div>
        <div class="right-area">
          <div class="book-detail-section">
            <h4>
              <span v-if="!showingSummary">章节详情</span>
              <span v-else>章节摘要 - {{ currentSummaryProperty }}</span>
              <button v-if="showingSummary" class="close-summary-btn" @click="closeSummary">关闭摘要</button>
            </h4>
            
            <!-- 摘要内容 -->
            <div v-if="showingSummary" class="summary-content">
              <div v-if="summaryLoading" class="loading-indicator">
                <p>正在加载摘要...</p>
              </div>
              <div v-else-if="summaryError && !currentSummary" class="error-message">
                <p>{{ summaryError }}</p>
                <button 
                  v-if="summaryError.includes('404')" 
                  class="retry-btn"
                  @click="fetchSummary(currentSummaryProperty)"
                >
                  重试获取摘要
                </button>
              </div>
              <div v-else class="summary-text">
                <p>{{ currentSummary }}</p>
                <div v-if="summaryError" class="summary-note">
                  <p><i>{{ summaryError }}</i></p>
                </div>
              </div>
            </div>
            
            <!-- 章节详情内容 -->
            <div v-else>
              <div v-if="loading" class="loading-indicator">
                <p>正在加载内容...</p>
              </div>
              <div v-else-if="hasSelectedSection" class="section-detail">
                <h3 class="section-title">
                  {{ selectedBook?.chapters[selectedChapter]?.title }} - 
                  {{ selectedBook?.chapters[selectedChapter]?.sections[selectedSection]?.title }}
                  <button 
                    class="show-original-btn" 
                    @click="fetchOriginalContent(selectedChapter, selectedSection)"
                    title="查看原文"
                  >
                    <span>📄 查看原文</span>
                  </button>
                </h3>
                
                <!-- 原文内容 -->
                <div v-if="showOriginalContent" class="original-content">
                  <div class="original-content-header">
                    <h4>原始 Markdown 内容</h4>
                    <button class="close-original-btn" @click="closeOriginalContent">关闭原文</button>
                  </div>
                  
                  <div v-if="originalContentLoading" class="loading-indicator">
                    <p>正在加载原文内容...</p>
                  </div>
                  <div v-else-if="originalContentError" class="error-message">
                    <p>{{ originalContentError }}</p>
                  </div>
                  <div v-else class="original-markdown">
                    <template v-for="(sentence, idx) in processedSentences" :key="idx">
                      <span
                        :id="`sentence-${idx}`"
                        v-if="highlightedSentences.includes(idx)"
                        class="highlighted-sentence-editable"
                      >
                        {{ sentence.text }}
                        <button @click="removeHighlight(idx)" class="remove-highlight-btn">取消高亮</button>
                      </span>
                      <span
                        :id="`sentence-${idx}`"
                        v-else
                        class="sentence-clickable"
                        @click="addHighlight(idx)"
                        title="点击高亮"
                      >
                        {{ sentence.text }}
                      </span>
                    </template>
                  </div>
                </div>
                
                <div class="section-content">
                  <!-- 显示章节内容，不再显示目录 -->
                  <p>
                    该文档的内容将在此处显示...
                  </p>
                </div>
                
                <div class="section-navigation">
                  <button 
                    class="nav-btn prev" 
                    @click="navigateToPrevSection"
                    :disabled="!hasPrevSection"
                  >上一节</button>
                  <span class="page-info">文件ID: {{ selectedBook?.chapters[selectedChapter]?.sections[selectedSection]?.fileId }}</span>
                  <button 
                    class="nav-btn next" 
                    @click="navigateToNextSection"
                    :disabled="!hasNextSection"
                  >下一节</button>
                </div>
              </div>
              <div v-else class="no-section-selected">
                <p>请从左侧目录选择一个章节查看详细内容</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加图片预览组件 -->
    <div v-if="showImagePreview" class="image-preview-overlay" @click="closeImagePreview">
      <div class="image-preview-container" @click.stop>
        <div class="image-preview-header">
          <h4>{{ previewImageTitle || '图片预览' }}</h4>
          <button class="close-preview-btn" @click="closeImagePreview">关闭</button>
        </div>
        <div class="image-preview-content">
          <div v-if="imageLoading" class="image-loading">
            <p>正在加载图片...</p>
          </div>
          <div v-if="imageError" class="image-error">
            <p>图片加载失败: {{ imageError }}</p>
            <div class="image-debug-info">
              <p>图片URL: {{ previewImageUrl }}</p>
              <button class="retry-btn" @click="retryLoadImage">重试加载</button>
              <button class="copy-url-btn" @click="copyImageUrl">复制图片URL</button>
            </div>
          </div>
          <img 
            v-show="!imageError" 
            :src="previewImageUrl" 
            :alt="previewImageTitle" 
            class="preview-image" 
            @load="handleImageLoaded" 
            @error="handleImageError" 
          />
        </div>
        <div v-if="previewImageContext" class="image-preview-context">
          <h5>图片上下文:</h5>
          <div class="context-content">
            <div v-if="previewImageContext.includes('【所在小节】')" class="section-info">
              {{ previewImageContext.split('\n\n')[0] }}
            </div>
            <pre class="context-text">{{ previewImageContext.includes('【所在小节】') ? previewImageContext.split('\n\n').slice(1).join('\n\n') : previewImageContext }}</pre>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 超细化目录弹窗 -->
    <div v-if="showDetailedToc" class="detailed-toc-overlay">
      <div class="detailed-toc-container">
        <div class="detailed-toc-header">
          <h3>超细化目录</h3>
          <div class="detailed-toc-actions">
            <button @click="exportDetailedToc" class="export-btn">
              导出目录
            </button>
            <button @click="showDetailedToc = false" class="close-btn">
              关闭
            </button>
          </div>
        </div>
        
        <div v-if="generatingDetailedToc" class="loading-container">
          <div class="loading-indicator">
            <p>正在生成超细化目录...</p>
            <div class="progress-bar">
              <div :style="{ width: detailedTocProgress + '%' }" class="progress"></div>
            </div>
          </div>
        </div>
        
        <div v-else-if="detailedTocError" class="error-message">
          {{ detailedTocError }}
        </div>
        
        <div v-else class="detailed-toc-content">
          <div class="toc-info">
            <p>原始目录深度: {{ originalTocDepth }} 级</p>
            <p>超细化目录深度: {{ detailedTocDepth }} 级</p>
          </div>
          
          <ul class="detailed-toc-list">
            <li v-for="(chapter, chapterIndex) in detailedToc" :key="chapterIndex">
              <div 
                class="chapter-title" 
                @click="toggleDetailedChapter(chapterIndex)"
                :class="{ 'expanded': expandedDetailedChapters[chapterIndex] }"
              >
                <span class="toggle-icon">
                  {{ expandedDetailedChapters[chapterIndex] ? '▼' : '▶' }}
                </span>
                {{ chapter.title }}
              </div>
              
              <ul v-if="expandedDetailedChapters[chapterIndex]" class="chapter-sections">
                <li v-for="(section, sectionIndex) in chapter.sections" :key="sectionIndex">
                  <div 
                    class="section-title"
                    @click="toggleDetailedSection(chapter.title, sectionIndex)"
                    :class="{ 'expanded': isDetailedSectionExpanded(chapter.title, sectionIndex) }"
                  >
                    <span class="toggle-icon">
                      {{ isDetailedSectionExpanded(chapter.title, sectionIndex) ? '▼' : '▶' }}
                    </span>
                    {{ section.title }}
                  </div>
                  
                  <!-- 显示超细化目录内容 -->
                  <ul v-if="isDetailedSectionExpanded(chapter.title, sectionIndex) && section.detailedToc" 
                      class="detailed-items">
                    <li v-for="(item, itemIndex) in getUniqueItems(section.detailedToc)" :key="itemIndex"
                        :class="[
                          'level-' + item.level,
                          item.type,
                          { 'has-items': hasSubItems(item) },
                          { 'figure-title': item.contentType === 'image' },
                          { 'table-title': item.contentType === 'table' },
                          { 'special-title': item.isSpecialTitle }
                        ]">
                      <div class="detailed-item-title"
                           @click="toggleDetailedItem(chapter.title, sectionIndex, item._originalIndex || itemIndex)"
                           :class="{ 
                             'expanded': isDetailedItemExpanded(chapter.title, sectionIndex, item._originalIndex || itemIndex),
                             'figure-item': item.contentType === 'image',
                             'table-item': item.contentType === 'table',
                             'sub-item': item.isSubItem
                           }">
                        <span class="toggle-icon" v-if="hasSubItems(item) && !item.isSpecialTitle">
                          {{ isDetailedItemExpanded(chapter.title, sectionIndex, item._originalIndex || itemIndex) ? '▼' : '▶' }}
                        </span>
                        <span class="item-type-icon" v-if="item.contentType === 'image'">🖼️</span>
                        <span class="item-type-icon" v-if="item.contentType === 'table'">📊</span>
                        <span class="item-prefix" v-if="item.numericPrefix">{{ item.numericPrefix }}</span>
                        <span class="item-number" v-if="item.type === 'numbered'">({{ item.number }})</span>
                        <span class="item-letter" v-if="item.type === 'lettered'">({{ item.letter }})</span>
                        <span class="item-title" :title="item.fullText || item.title">{{ item.title }}</span>
                        
                        <span v-if="item.fullText && item.fullText !== item.title" class="item-has-details" title="包含更多详细内容">...</span>
                      </div>
                      
                      <!-- 显示子项 -->
                      <ul v-if="isDetailedItemExpanded(chapter.title, sectionIndex, item._originalIndex || itemIndex) && 
                                hasSubItems(item) && 
                                !item.isSpecialTitle" 
                          class="sub-items">
                        <li v-for="(subItem, subIndex) in getUniqueSubItems(item.items)" :key="subIndex"
                            :class="[
                              'sub-item', 
                              subItem.type,
                              { 'extracted-item': subItem.type === 'extracted' }
                            ]">
                          <div class="sub-item-title">
                            <span class="item-prefix" v-if="subItem.numericPrefix">{{ subItem.numericPrefix }}</span>
                            <span class="item-number" v-if="subItem.type === 'numbered'">({{ subItem.number }})</span>
                            <span class="item-letter" v-if="subItem.type === 'lettered'">({{ subItem.letter }})</span>
                            <span class="item-title" :title="subItem.title">{{ subItem.title }}</span>
                          </div>
                          
                          <!-- 支持三级嵌套（冒号提取的内容可能有子项） -->
                          <ul v-if="subItem.items && subItem.items.length > 0" class="nested-sub-items">
                            <li v-for="(nestedItem, nestedIndex) in subItem.items" :key="nestedIndex"
                                class="nested-item">
                              <div class="nested-item-title">
                                <span class="item-prefix" v-if="nestedItem.numericPrefix">{{ nestedItem.numericPrefix }}</span>
                                <span class="item-number" v-if="nestedItem.type === 'numbered'">({{ nestedItem.number }})</span>
                                <span class="item-letter" v-if="nestedItem.type === 'lettered'">({{ nestedItem.letter }})</span>
                                <span class="item-title">{{ nestedItem.title }}</span>
                              </div>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import axios from 'axios';
  import CitationViewer from './CitationViewer.vue';
  
  // 定义接口
  interface TocItem {
    level: number;
    title: string;
    numericPrefix: string;
    id?: string;
    isImage?: boolean; // 添加标识是否为图片的属性
    parentSection?: string; // 添加父级小节属性
  }
  
  interface Section {
    title: string;
    pageNumber: number;
    fileId?: number;
    content?: string;
    toc?: TocItem[]; // 确保类型正确
    summary?: string; // 添加摘要字段
    isFetchingSummary?: boolean; // 是否正在获取摘要
  }
  
  interface Chapter {
    title: string;
    sections: Section[];
    expanded?: boolean;
    chapter: string;
  }
  
  interface Book {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    chapters: Chapter[];  // chapters 是必需的，会在 fetchAllMarkdownFiles 中自动构建
  }
  
  interface MarkdownFile {
    id: number;
    property: string;
    file_path: string;
    file_type: string;
    is_directory?: boolean;
    fileName?: string;
  }
  
  // 添加摘要接口
  interface SummaryResponse {
    summaryFile?: {
      id: number;
      property: string;
      file_path: string;
      file_type: string;
    };
    content?: string;
    brief?: boolean;
    markdownFile?: {
      id: number;
      property: string;
      file_path: string;
    };
    error?: string;
    autoGenerated?: boolean;
  }
  
  // 添加原文内容响应接口
  interface ContentResponse {
    content?: string;
    fileInfo?: {
      id: number;
      property: string;
      file_path: string;
    };
    error?: string;
  }
  
  // 定义组件的 props
  const props = defineProps<{
    book?: Book;
  }>();
  
  // 定义组件的 emits
  const emit = defineEmits<{
    (e: 'close'): void;
  }>();
  
  // 当前选中的书籍
  const selectedBook = ref<Book | undefined>(props.book);
  
  // 加载状态
  const loading = ref(false);
  const error = ref('');
  
  // 展开的章节
  const expandedChapters = ref<Record<number, boolean>>({});
  // 展开的小节
  const expandedSections = ref<Record<string, boolean>>({});
  // 展开的子目录
  const expandedSubsections = ref<Record<string, boolean>>({});
  
  // 当前选中的章节和小节
  const selectedChapter = ref<number>(-1);
  const selectedSection = ref<number>(-1);
  const sectionContent = ref<string>('');
  
  // 添加摘要相关状态
  const showingSummary = ref(false);
  const currentSummary = ref<string>('');
  const summaryLoading = ref(false);
  const summaryError = ref('');
  const currentSummaryProperty = ref<string>('');
  
  // 添加导出相关状态
  const showExportSuccess = ref(false);
  
  // 在现有的状态变量声明附近添加
  const showOriginalContent = ref(false);
  const originalContent = ref('');
  const originalContentLoading = ref(false);
  const originalContentError = ref('');
  
  // 添加图片预览相关状态
  const showImagePreview = ref(false);
  const previewImageUrl = ref('');
  const previewImageTitle = ref('');
  const previewImageContext = ref('');
  const expandedImageLists = ref<Record<string, boolean>>({});
  
  // 添加图片加载状态
  const imageLoading = ref(true);
  const imageError = ref('');
  const lastImageSrc = ref('');
  
  // 添加中间栏图片上下文相关状态
  const figureContextSectionTitle = ref('');
  const figureContextText = ref('');
  
  // 计算属性：是否有选中的小节
  const hasSelectedSection = computed(() => {
    return selectedChapter.value >= 0 && selectedSection.value >= 0;
  });
  
  // 计算属性：是否有上一节
  const hasPrevSection = computed(() => {
    if (!selectedBook.value) return false;
    
    if (selectedSection.value > 0) {
      return true;
    } else if (selectedChapter.value > 0) {
      return selectedBook.value.chapters[selectedChapter.value - 1].sections.length > 0;
    }
    
    return false;
  });
  
  // 计算属性：是否有下一节
  const hasNextSection = computed(() => {
    if (!selectedBook.value) return false;
    
    const currentChapter = selectedBook.value.chapters[selectedChapter.value];
    if (selectedSection.value < currentChapter.sections.length - 1) {
      return true;
    } else if (selectedChapter.value < selectedBook.value.chapters.length - 1) {
      return selectedBook.value.chapters[selectedChapter.value + 1].sections.length > 0;
    }
    
    return false;
  });
  
  // 获取所有 Markdown 文件
  const fetchAllMarkdownFiles = async () => {
    // 获取书籍ID，如果是字符串则转换为数字
    const bookId = props.book ? (typeof props.book.id === 'string' ? parseInt(props.book.id) : props.book.id) : 1;
    
    console.log(`开始获取书籍 ${bookId} 的所有 Markdown 文件...`);
    
    loading.value = true;
    error.value = '';
    
    try {
      console.log('开始获取所有 Markdown 文件...');
      // 使用正确的 API 路径，包含 bookId 参数
      const baseUrl = 'http://localhost:8080/api/files/markdown';
      const url = `${baseUrl}?bookId=${bookId}`;
      
      console.log(`请求 URL: ${url}`);
      const response = await axios.get(url);
      console.log('API 响应:', response);
      
      
      interface MarkdownResponse {
        files?: MarkdownFile[];
        total?: number;
        error?: string;
      }
      
      const data = response.data as MarkdownResponse;
      
      if (data && data.files && data.files.length > 0) {
        console.log('成功获取 Markdown 文件:', data.files);
        // 调试：打印第一个文件的完整结构
        if (data.files.length > 0) {
          console.log('第一个文件的完整结构:', JSON.stringify(data.files[0], null, 2));
          console.log('第一个文件的 id 字段:', data.files[0].id, '类型:', typeof data.files[0].id);
        }
        
        // 提取文件名
        const filesWithNames = data.files.map(file => {
          // 从文件路径中提取文件名
          const pathParts = file.file_path.split(/[\/\\]/);
          const fileName = pathParts[pathParts.length - 1];
          // 调试：确认 file.id 存在
          if (!file.id && file.id !== 0) {
            console.warn('文件缺少 id 字段:', file);
          }
          return {
            ...file,
            fileName
          };
        });
        
        // 将文件按章节属性分组
        const groupedFiles = filesWithNames.reduce((groups: Record<string, MarkdownFile[]>, file) => {
          // 处理 property 为空的情况
          const property = file.property || 'other';
          // 提取章节号，如果 property 是 "1.1"，则章节号为 "1"
          const chapter = property.includes('.') ? property.split('.')[0] : property;
          
          if (!groups[chapter]) {
            groups[chapter] = [];
          }
          
          groups[chapter].push(file);
          return groups;
        }, {});
        
        console.log('文件分组结果:', groupedFiles);
        
        // 转换为章节格式
        const markdownChapters: Chapter[] = Object.keys(groupedFiles)
          .sort((a, b) => {
            // 尝试按数字排序
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return a.localeCompare(b);
          })
          .map(chapter => {
            const files = groupedFiles[chapter];
            
            // 按属性排序文件
            files.sort((a, b) => {
              const propA = a.property || '';
              const propB = b.property || '';
              return compareProperties(propA, propB);
            });
            
            // 创建章节对象
            // 处理章节标题：如果chapter已经是"第X章"格式，直接使用；否则添加"第"和"章"
            let chapterTitle = chapter;
            if (!chapterTitle.match(/^第.*章$/)) {
              // 如果chapter是纯数字，转换为"第X章"格式
              if (/^\d+$/.test(chapterTitle)) {
                chapterTitle = `第${chapterTitle}章`;
              }
              // 如果chapter已经是"第一章"这样的格式，直接使用（不需要else，因为已经是chapterTitle了）
            }
            
            return {
              chapter,
              title: chapterTitle,
              expanded: false,
              sections: files.map(file => {
                // 从文件名中提取标题
                const fileName = file.fileName || '';
                // 移除可能的 bookId_ 前缀（如 "6_1.1.md" -> "1.1.md"）
                const cleanedName = fileName.replace(/^\d+_/, '');
                // 移除文件扩展名作为标题
                let title = cleanedName.replace(/\.(md|markdown)$/i, '');
                
                // 如果标题已经包含章节号前缀（如"第X章"），且与当前章节匹配，则移除重复的章节前缀
                // 避免显示"第1章 - 第1章 1.1"这样的重复
                const chapterNumberMatch = chapter.match(/^第?(\d+)章?$/);
                if (chapterNumberMatch) {
                  const chapterNum = chapterNumberMatch[1];
                  // 如果标题以"第X章"开头且X与当前章节号相同，移除这个前缀
                  const titleChapterMatch = title.match(/^第(\d+)章\s*/);
                  if (titleChapterMatch && titleChapterMatch[1] === chapterNum) {
                    title = title.replace(/^第\d+章\s*/, '').trim();
                  }
                }
                
                // 调试：确认 fileId 设置正确
                const fileId = file.id;
                if (!fileId && fileId !== 0) {
                  console.error('文件缺少 id 字段，无法设置 fileId:', file);
                } else {
                  console.log(`设置 section fileId: ${fileId} (${file.property || '未知属性'})`);
                }
                
                return {
                  title: title,
                  pageNumber: 1, // 默认页码
                  fileId: fileId
                };
              })
            };
          });
        
        console.log('生成的章节结构:', markdownChapters);
        
        // 保留预设书籍的基本信息，更新章节内容
        if (props.book) {
          selectedBook.value = {
            ...props.book,
            chapters: markdownChapters
          };
        } else {
          // 如果没有预设书籍，创建一个新的
          selectedBook.value = {
            id: '1',
            title: '地质科学文档库',
            author: '系统自动整理',
            coverUrl: '/书籍封面.jpg',
            chapters: markdownChapters
          };
        }
        
        // 确保封面URL正确
        if (selectedBook.value && !selectedBook.value.coverUrl.startsWith('http')) {
          // 如果不是绝对URL，确保路径正确
          if (!selectedBook.value.coverUrl.startsWith('/')) {
            selectedBook.value.coverUrl = '/' + selectedBook.value.coverUrl;
          }
        }
        
        // 默认展开第一章
        if (markdownChapters.length > 0) {
          expandedChapters.value[0] = true;
        }
        
        return true; // 表示成功获取数据
      } else {
        console.warn('没有找到 Markdown 文件');
        error.value = '没有找到 Markdown 文件，请先上传文件';
        return false; // 表示获取数据失败
      }
    } catch (err: any) {
      console.error('获取 Markdown 文件失败:', err);
      handleApiError(err, '获取 Markdown 文件失败');
      throw err; // 重新抛出错误，让调用者处理
    } finally {
      loading.value = false;
    }
  };
  
  // 获取文件的目录结构
  const fetchFileToc = async (fileId: number) => {
    try {
      console.log(`开始获取文件 ID ${fileId} 的目录结构...`);
      // 使用完整的 URL 路径
      const url = `http://localhost:8080/api/files/markdown/${fileId}/toc`;
      console.log('请求 URL:', url);
      
      const response = await axios.get(url);
      console.log('API 响应:', response);
      
      interface TocResponse {
        fileInfo?: {
          id: number;
          property: string;
          file_path: string;
        };
        toc?: TocItem[];
        error?: string;
      }
      
      const data = response.data as TocResponse;
      
      if (data && data.toc) {
        console.log('成功获取文件目录结构:', data.toc);
        return data;
      } else {
        console.error('API 响应格式不符合预期:', response.data);
        return null;
      }
    } catch (err: any) {
      console.error(`获取文件 ID ${fileId} 的目录结构失败:`, err);
      return null;
    }
  };
  
  // 比较两个属性字符串（如 "4.2" 和 "4.10"）
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
          if (numA !== numB) {
            return numA - numB;
          }
        } else {
          const strComp = partsA[i].localeCompare(partsB[i]);
          if (strComp !== 0) {
            return strComp;
          }
        }
      } catch (e) {
        const strComp = partsA[i].localeCompare(partsB[i]);
        if (strComp !== 0) {
          return strComp;
        }
      }
    }
    
    return partsA.length - partsB.length;
  };
  
  // 处理 API 错误
  const handleApiError = (err: any, message: string) => {
    if (err.response) {
      console.error('错误响应:', err.response.status, err.response.data);
      error.value = `${message}: 服务器返回 ${err.response.status} - ${err.response.data.error || '未知错误'}`;
    } else if (err.request) {
      console.error('请求未收到响应:', err.request);
      error.value = `${message}: 服务器未响应，请检查后端服务是否运行`;
    } else {
      console.error('请求配置错误:', err.message);
      error.value = `${message}: ${err.message}`;
    }
  };
  
  // 切换章节展开/折叠
  const toggleChapter = (index: number) => {
    expandedChapters.value[index] = !expandedChapters.value[index];
  };
  
  // 切换小节展开/折叠
  const toggleSection = (chapterIndex: number, sectionIndex: number, event: Event) => {
    event.stopPropagation(); // 阻止事件冒泡
    const key = `${chapterIndex}-${sectionIndex}`;
    expandedSections.value[key] = !expandedSections.value[key];
    
    // 如果是展开，则选中小节
    if (expandedSections.value[key]) {
      selectSection(chapterIndex, sectionIndex);
    } else {
      // 如果是收起，且当前选中的是这个小节，则取消选中
      if (selectedChapter.value === chapterIndex && selectedSection.value === sectionIndex) {
        selectedChapter.value = -1;
        selectedSection.value = -1;
      }
    }
  };
  
  // 检查小节是否展开
  const isSectionExpanded = (chapterIndex: number, sectionIndex: number) => {
    const key = `${chapterIndex}-${sectionIndex}`;
    return !!expandedSections.value[key];
  };
  
  // 选择小节
  const selectSection = async (chapterIndex: number, sectionIndex: number) => {
    selectedChapter.value = chapterIndex;
    selectedSection.value = sectionIndex;
    const selSection = selectedBook.value?.chapters[chapterIndex].sections[sectionIndex];
    if (selSection && !selSection.content && selSection.fileId) {
      selSection.content = await fetchSectionContent(selSection.fileId) || '';
    }
    
    // 获取当前选中的小节
    const section = selectedBook.value?.chapters[chapterIndex].sections[sectionIndex];
    if (section && section.fileId && !section.toc) {
      // 如果没有目录数据，获取文件的目录结构
      loading.value = true;
      const result = await fetchFileToc(section.fileId);
      loading.value = false;
      
      if (result && result.toc) {
        // 过滤掉图片标题（通常以"图"开头）
        const filteredToc = result.toc.map(item => {
          // 使用布尔值而不是字符串
          const isImage = Boolean(
            item.title.trim().startsWith('图') || 
            (item.numericPrefix && item.numericPrefix.startsWith('图'))
          );
          return { ...item, isImage };
        });
        
        // 更新小节的目录数据
        if (selectedBook.value) {
          selectedBook.value.chapters[chapterIndex].sections[sectionIndex].toc = filteredToc;
        }
      }
    }
  };
  
  // 导航到上一节
  const navigateToPrevSection = () => {
    if (!selectedBook.value) return;
    
    if (selectedSection.value > 0) {
      selectedSection.value--;
    } else if (selectedChapter.value > 0) {
      selectedChapter.value--;
      selectedSection.value = selectedBook.value.chapters[selectedChapter.value].sections.length - 1;
    }
  };
  
  // 导航到下一节
  const navigateToNextSection = () => {
    if (!selectedBook.value) return;
    
    const currentChapter = selectedBook.value.chapters[selectedChapter.value];
    if (selectedSection.value < currentChapter.sections.length - 1) {
      selectedSection.value++;
    } else if (selectedChapter.value < selectedBook.value.chapters.length - 1) {
      selectedChapter.value++;
      selectedSection.value = 0;
    }
  };
  
  // 关闭查看器
  const closeViewer = () => {
    emit('close');
  };
  
  // 切换子目录展开/折叠
  const toggleSubsection = (chapterIndex: number, sectionIndex: number, itemIndex: number) => {
    const key = `${chapterIndex}-${sectionIndex}-${itemIndex}`;
    expandedSubsections.value[key] = !expandedSubsections.value[key];
  };
  
  // 检查子目录是否展开
  const isSubsectionExpanded = (chapterIndex: number, sectionIndex: number, itemIndex: number) => {
    const key = `${chapterIndex}-${sectionIndex}-${itemIndex}`;
    return !!expandedSubsections.value[key];
  };
  
  // 检查目录项是否有子项
  const hasChildren = (toc: TocItem[] | undefined, itemIndex: number) => {
    if (!toc || itemIndex >= toc.length) return false;
    
    const currentLevel = toc[itemIndex].level;
    // 检查下一项是否存在且级别更深
    return itemIndex < toc.length - 1 && toc[itemIndex + 1].level > currentLevel;
  };
  
  // 获取目录项的子项
  const getChildren = (toc: TocItem[] | undefined, itemIndex: number) => {
    if (!toc || itemIndex >= toc.length) return [];
    
    const currentLevel = toc[itemIndex].level;
    const children: TocItem[] = [];
    
    // 从当前项的下一项开始，收集所有级别更深的项
    for (let i = itemIndex + 1; i < toc.length; i++) {
      if (toc[i].level <= currentLevel) break; // 如果级别小于等于当前级别，说明不是子项
      if (!toc[i].isImage) { // 排除图片标题
        children.push(toc[i]);
      }
    }
    
    return children;
  };
  
  // 获取章节摘要
  const fetchSummary = async (property: string) => {
    if (!property) {
      summaryError.value = '无效的章节属性';
      return;
    }
    
    // 如果已经在显示这个章节的摘要，则关闭摘要
    if (showingSummary.value && currentSummaryProperty.value === property) {
      showingSummary.value = false;
      currentSummaryProperty.value = '';
      return;
    }
    
    // 获取书籍ID
    const bookId = props.book ? (typeof props.book.id === 'string' ? parseInt(props.book.id) : props.book.id) : 1;
    
    summaryLoading.value = true;
    summaryError.value = '';
    showingSummary.value = true;
    currentSummaryProperty.value = property;
    
    try {
      console.log(`开始获取章节 ${property} 的摘要（书籍ID: ${bookId}）...`);
      
      // 使用正确的 API 路径，包含 bookId 参数
      const url = `http://localhost:8080/api/files/summary/${property}?brief=false&autoGenerate=true&bookId=${bookId}`;
      
      console.log(`请求摘要 URL: ${url}`);
      const response = await axios.get(url);
          console.log('摘要 API 响应:', response);
      
      const data = response.data as SummaryResponse;
      
      if (data && data.content) {
        currentSummary.value = data.content;
        // 如果是自动生成的摘要，显示提示信息
        if (data.autoGenerated) {
          summaryError.value = '注意：这是自动生成的摘要，可能不够准确。';
        }
      } else if (data && data.error) {
        summaryError.value = data.error;
      } else {
        // 如果没有内容但请求成功，显示一个友好的消息
        summaryError.value = `章节 ${property} 暂无摘要信息`;
      }
    } catch (err: any) {
      console.error(`获取章节 ${property} 的摘要失败:`, err);
      if (err.response) {
        if (err.response.status === 404) {
          summaryError.value = `章节 ${property} 的摘要不存在，可能是该章节尚未添加摘要或章节编号不正确`;
        } else {
          summaryError.value = `获取摘要失败: ${err.response.status} - ${err.response.data?.error || '未知错误'}`;
        }
      } else {
        summaryError.value = `获取摘要失败: ${err.message}`;
      }
      
      // 添加一个模拟摘要，用于演示目的
      if (err.response && err.response.status === 404) {
        setTimeout(() => {
          if (showingSummary.value && currentSummaryProperty.value === property) {
            currentSummary.value = `这是章节 ${property} 的模拟摘要内容，用于演示目的。\n\n实际应用中，这里将显示从后端 API 获取的真实摘要内容。`;
            summaryError.value = '注意：这是模拟数据，因为后端 API 返回了 404 错误。';
          }
        }, 1500);
      }
    } finally {
      summaryLoading.value = false;
    }
  };
  
  // 关闭摘要
  const closeSummary = () => {
    showingSummary.value = false;
    currentSummaryProperty.value = '';
  };
  
  // 批量生成所有章节的摘要
  const generateAllSummaries = async () => {
    if (!selectedBook.value || !selectedBook.value.chapters) {
      console.error('没有可用的章节来生成摘要');
      return;
    }
    
    // 获取书籍ID
    const bookId = props.book ? (typeof props.book.id === 'string' ? parseInt(props.book.id) : props.book.id) : 1;
    
    // 显示正在生成摘要的提示
    loading.value = true;
    error.value = '正在批量生成摘要，请稍候...';
    
    try {
      // 收集所有章节编号
      const chapterProperties: string[] = [];
      
      // 遍历所有章节和小节，收集编号
      selectedBook.value.chapters.forEach(chapter => {
        // 添加章节编号
        if (chapter.chapter) {
          chapterProperties.push(chapter.chapter);
        }
        
        // 添加小节编号
        chapter.sections.forEach(section => {
          const sectionNumber = section.title.split(' ')[0];
          if (sectionNumber && /^\d+(\.\d+)*$/.test(sectionNumber)) {
            chapterProperties.push(sectionNumber);
          }
        });
      });
      
      console.log(`需要生成摘要的章节编号（书籍ID: ${bookId}）:`, chapterProperties);
      
      // 批量生成摘要
      let succeeded = 0;
      let failed = 0;
      
      for (const property of chapterProperties) {
        try {
          // 使用正确的 API 路径，包含 bookId 参数
          const url = `http://localhost:8080/api/files/summary/${property}?brief=false&autoGenerate=true&bookId=${bookId}`;
          
              console.log(`尝试生成章节 ${property} 的摘要，URL: ${url}`);
              const response = await axios.get(url);
              if (response.data && (response.data as SummaryResponse).content) {
                console.log(`成功生成章节 ${property} 的摘要`);
                succeeded++;
          } else {
            console.error(`无法生成章节 ${property} 的摘要：响应中没有内容`);
            failed++;
          }
          
          // 更新状态信息
          error.value = `正在生成摘要: ${succeeded + failed}/${chapterProperties.length}`;
          
        } catch (err) {
          console.error(`生成章节 ${property} 的摘要时发生错误:`, err);
          failed++;
        }
      }
      
      // 显示结果
      error.value = `摘要生成完成: ${succeeded} 个成功, ${failed} 个失败。现在可以点击章节旁边的摘要按钮查看摘要。`;
      
      // 5秒后自动清除提示
      setTimeout(() => {
        if (error.value.includes('摘要生成完成')) {
          error.value = '';
        }
      }, 5000);
    } catch (err) {
      console.error('批量生成摘要时发生错误:', err);
      error.value = `批量生成摘要失败: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      loading.value = false;
    }
  };
  
  // 导出目录方法
  const exportToc = async () => {
    if (!selectedBook.value || !selectedBook.value.chapters) {
      console.error('没有可导出的目录');
      return;
    }
    
    try {
      // 加载所有章节的目录
      for (const chapter of selectedBook.value.chapters) {
        for (const section of chapter.sections) {
          if (section.fileId && !section.toc) {
            const result = await fetchFileToc(section.fileId);
            if (result && result.toc) {
              section.toc = result.toc.filter(item => !item.isImage && !item.title.trim().startsWith('图') && !item.title.trim().startsWith('表'));
            }
          }
        }
      }
      
      // 创建目录内容
      let content = `# ${selectedBook.value.title}\n\n`;
      
      // 遍历章节
      selectedBook.value.chapters.forEach((chapter) => {
        content += `## ${chapter.title}\n\n`;
        
        // 遍历小节
        chapter.sections.forEach((section) => {
          // 提取小节编号和标题
          const sectionMatch = section.title.match(/^(\d+(\.\d+)*)\s*(.*)/);
          const sectionNumber = sectionMatch ? sectionMatch[1] : '';
          const sectionTitle = sectionMatch ? sectionMatch[3] : section.title;
          
          if (section && sectionNumber) {
            content += `### ${sectionNumber} ${sectionTitle}\n`;
            
            // 如果有子目录，添加子目录
            if (section.toc && Array.isArray(section.toc) && section.toc.length > 0) {
              // 过滤掉图的目录项
              const nonImageItems = section.toc.filter(item => !item.isImage && !item.title.trim().startsWith('图') && !item.title.trim().startsWith('表'));
              
              // 获取图和表项，用于添加为注释
              const imageAndTableItems = section.toc.filter(item => 
                item.isImage || 
                item.title.trim().startsWith('图') || 
                item.title.trim().startsWith('表')
              );
              
              // 递归处理子目录项
              const processTocItems = (items, level = 1) => {
                items.forEach((tocItem) => {
                  // 计算缩进（每个层级增加2个空格）
                  const indent = '  '.repeat(level);
                  
                  // 添加目录项，保持原有的编号和标题格式
                  if (tocItem.numericPrefix || tocItem.title) {
                    content += `${indent}- ${tocItem.numericPrefix} ${tocItem.title}\n`;
                  }
                  
                  // 递归处理子项
                  const children = getChildren(section.toc || [], section.toc ? section.toc.indexOf(tocItem) : -1);
                  if (children.length > 0) {
                    processTocItems(children, level + 1);
                  }
                });
              };
              
              // 处理正常目录项
              processTocItems(nonImageItems);
              
              // 添加图和表作为注释
              if (imageAndTableItems.length > 0) {
                content += '\n<!-- 图表列表 -->\n';
                imageAndTableItems.forEach(item => {
                  content += `<!-- ${item.numericPrefix} ${item.title} -->\n`;
                });
              }
              
              content += '\n';
            }
          }
        });
      });
      
      // 创建 Blob 对象
      const blob = new Blob([content], { type: 'text/markdown' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedBook.value.title}-目录.md`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // 显示导出成功提示
        showExportSuccess.value = true;
        
        // 3秒后自动隐藏提示
        setTimeout(() => {
          showExportSuccess.value = false;
        }, 3000);
      }, 500);
    } catch (error) {
      console.error('导出目录时发生错误:', error);
      alert('导出目录失败，请查看控制台获取详细信息。');
    }
  };
  
  // 添加获取原文内容的方法
  const fetchOriginalContent = async (chapterIndex: number, sectionIndex: number) => {
    // 获取当前选中的小节
    const section = selectedBook.value?.chapters[chapterIndex].sections[sectionIndex];
    if (!section || !section.fileId) {
      originalContentError.value = '无法获取原文：文件ID不存在';
      return;
    }
    
    originalContentLoading.value = true;
    originalContentError.value = '';
    showOriginalContent.value = true;
    
    try {
      // 调试：打印 fileId 信息
      console.log(`开始获取原文内容，fileId: ${section.fileId} (类型: ${typeof section.fileId})`);
      
      // 构建API URL
      const url = `http://localhost:8080/api/files/markdown/${section.fileId}/content`;
      console.log('请求原文内容 URL:', url);
      
      const response = await axios.get(url);
      console.log('原文内容 API 响应:', response);
      
      // 后端返回的数据结构可能是 { content: "...", fileInfo: {...} } 或 { content: "..." }
      const data = response.data as ContentResponse;
      
      if (data && data.content) {
        console.log('成功获取原文内容，长度:', data.content.length);
        originalContent.value = data.content;
      } else if (response.data && typeof response.data === 'object') {
        // 尝试从不同的字段获取内容
        const content = (response.data as any).content || (response.data as any).data?.content;
        if (content) {
          console.log('从响应数据中提取原文内容，长度:', content.length);
          originalContent.value = content;
        } else {
          originalContentError.value = '获取原文内容失败：响应格式不符合预期';
          console.warn('响应中没有找到 content 字段:', response.data);
        }
      } else {
        originalContentError.value = '获取原文内容失败：响应格式不符合预期';
      }
    } catch (err: any) {
      console.error('获取原文内容失败:', err);
      if (err.response) {
        console.error('错误响应状态:', err.response.status);
        console.error('错误响应数据:', err.response.data);
        originalContentError.value = `获取原文失败: ${err.response.status} - ${err.response.data?.error || '未知错误'}`;
      } else if (err.request) {
        originalContentError.value = '获取原文失败: 服务器未响应，请检查后端服务是否运行';
      } else {
        originalContentError.value = `获取原文失败: ${err.message}`;
      }
    } finally {
      originalContentLoading.value = false;
    }
  };
  
  // 关闭原文显示
  const closeOriginalContent = () => {
    showOriginalContent.value = false;
    originalContent.value = '';
  };
  
  // 处理原始Markdown内容，高亮图片链接
  const processedOriginalContent = computed(() => {
    if (!originalContent.value) return '';
    
    // 使用正则表达式匹配图片链接
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    
    // 替换图片链接为可点击的高亮版本
    return originalContent.value.replace(imageRegex, (match, alt, src) => {
      // 构建可点击的HTML
      return `<span class="clickable-image" data-src="${src}" data-alt="${alt || ''}" onclick="window.previewImage(event, '${src}', '${alt || ''}')">
        <span class="image-icon">🖼️</span> ${match}
      </span>`;
    });
  });
  
  // 获取目录中的图片项
  const getImageItems = (toc: TocItem[] | undefined) => {
    if (!toc) return [];
    
    return toc.filter(item => {
      // 检查是否为图片（通过isImage属性）
      if (item.isImage) return true;
      
      // 检查标题是否以"图"或"表"开头
      const title = item.title.trim();
      if (title.startsWith('图') || title.startsWith('表')) return true;
      
      // 检查numericPrefix是否以"图"或"表"开头
      const prefix = item.numericPrefix?.trim() || '';
      if (prefix.startsWith('图') || prefix.startsWith('表')) return true;
      
      // 检查是否包含图片链接格式 ![](...)
      if (title.includes('![') && title.includes('](') && title.includes(')')) return true;
      
      // 检查是否匹配"图x.x"或"表x.x"的格式（使用正则表达式）
      const imageRegex = /^(图|表)\s*\d+(\.\d+)*\s*[:：]?/;
      if (imageRegex.test(title)) return true;
      
      return false;
    });
  };
  
  // 切换图表列表的展开/折叠状态
  const toggleImageList = (chapterIndex: number, sectionIndex: number) => {
    const key = `img-${chapterIndex}-${sectionIndex}`;
    expandedImageLists.value[key] = !expandedImageLists.value[key];
  };
  
  // 检查图表列表是否展开
  const isImageListExpanded = (chapterIndex: number, sectionIndex: number) => {
    const key = `img-${chapterIndex}-${sectionIndex}`;
    return !!expandedImageLists.value[key];
  };
  
  // 从目录中预览图片
  const previewImageFromToc = (imageItem: TocItem, chapterIndex: number, sectionIndex: number) => {
    // 获取图片标题
    let displayTitle = imageItem.title || '未命名图片';
    
    // 如果标题太长，尝试提取更简洁的标题
    if (displayTitle.length > 50) {
      // 尝试提取"图x.x"格式的标题
      const titleMatch = displayTitle.match(/^(图|表)\s*\d+(\.\d+)*\s*[:：]?(.*)/);
      if (titleMatch) {
        displayTitle = titleMatch[0].trim();
      }
    }
    
    previewImageTitle.value = displayTitle;
    
    // 获取图片路径（如果有）
    let imageSrc = '';
    const titleMatch = imageItem.title.match(/!\[(.*?)\]\((.*?)\)/);
    if (titleMatch && titleMatch[2]) {
      imageSrc = titleMatch[2];
    }
    
    // 如果没有从标题中找到图片路径，尝试从上下文中查找
    if (!imageSrc && selectedBook.value) {
      // 尝试获取章节内容
      const section = selectedBook.value.chapters[chapterIndex].sections[sectionIndex];
      
      // 记录图片所属的小节信息
      const parentSection = section.title;
      // 扩展imageItem，添加parentSection属性
      const enhancedImageItem = { ...imageItem, parentSection };
      
      // 如果没有内容，先获取内容
      if (!section.content && section.fileId) {
        // 先显示加载中
        previewImageContext.value = '正在加载图片上下文...';
        showImagePreview.value = true;
        
        // 获取章节内容
        fetchSectionContent(section.fileId).then(content => {
          if (content) {
            section.content = content;
            findImageInContent(enhancedImageItem, section.content);
          } else {
            previewImageContext.value = '无法加载图片上下文';
          }
        });
      } else if (section.content) {
        findImageInContent(enhancedImageItem, section.content);
      }
    } else if (imageSrc) {
      // 如果已经找到了图片路径，直接显示预览
      showImageWithPath(imageSrc);
    } else {
      // 如果没有找到图片路径，显示错误信息
      alert('无法找到图片路径');
    }
  };
  
  // 在内容中查找图片
  const findImageInContent = (imageItem: TocItem, content: string) => {
    const contentLines = content.split('\n');
    let contextStart = 0;
    let contextEnd = contentLines.length - 1;
    let imageSrc = '';
    let sectionTitle = '';
    let imageLineIndex = -1;
    
    // 查找图片所在的行
    for (let i = 0; i < contentLines.length; i++) {
      // 检查行是否包含图片标题
      if (contentLines[i].includes(imageItem.title) || 
          (imageItem.numericPrefix && contentLines[i].includes(imageItem.numericPrefix))) {
        imageLineIndex = i;
        
        // 在当前行及其前后几行中查找图片链接
        for (let j = Math.max(0, i - 5); j <= Math.min(contentLines.length - 1, i + 5); j++) {
          const lineMatch = contentLines[j].match(/!\[(.*?)\]\((.*?)\)/);
          if (lineMatch && lineMatch[2]) {
            imageSrc = lineMatch[2];
            break;
          }
        }
        
        break;
      }
    }
    
    // 如果找到了图片所在行
    if (imageLineIndex !== -1) {
      // 向上查找最近的小节标题（通常以 # 开头或数字编号开头）
      let sectionLineIndex = -1;
      
      for (let j = imageLineIndex; j >= 0; j--) {
        const line = contentLines[j].trim();
        
        // 跳过空行和图片标题行
        if (line === '' || 
            line === imageItem.title || 
            (imageItem.numericPrefix && line.includes(imageItem.numericPrefix))) {
          continue;
        }
        
        // 匹配Markdown标题格式（# 或 ## 或 ### 等）
        if (/^#{1,6}\s+.+/.test(line) && !line.includes('图') && !line.includes('表')) {
          sectionLineIndex = j;
          sectionTitle = line.replace(/^#{1,6}\s+/, '').trim();
          break;
        }
        
        // 匹配数字编号格式（如 1.1.2.1）
        // 确保这不是图表编号（不包含"图"或"表"）
        if (/^\d+(\.\d+)*\s+.+/.test(line) && !line.includes('图') && !line.includes('表')) {
          sectionLineIndex = j;
          sectionTitle = line.trim();
          break;
        }
        
        // 如果遇到另一个图表标题，继续向上查找
        if (line.startsWith('图') || line.startsWith('表')) {
          continue;
        }
        
        // 如果已经向上查找了20行还没找到小节标题，停止查找
        if (imageLineIndex - j > 20) {
          break;
        }
      }
      
      // 如果没有找到明确的小节标题，尝试从目录结构中获取
      if (sectionTitle === '' && imageItem.parentSection) {
        sectionTitle = imageItem.parentSection;
      }
      
      // 设置上下文范围
      if (sectionLineIndex !== -1) {
        // 如果找到了小节标题，从标题开始显示
        contextStart = sectionLineIndex;
        // 确保上下文包含图片行
        contextEnd = Math.min(contentLines.length - 1, imageLineIndex + 3);
      } else {
        // 如果没找到小节标题，就只显示图片周围的内容
        contextStart = Math.max(0, imageLineIndex - 3);
        contextEnd = Math.min(contentLines.length - 1, imageLineIndex + 3);
      }
    }
    
    // 提取上下文
    const contextLines = contentLines.slice(contextStart, contextEnd + 1);
    
    // 如果找到了小节标题，在上下文开头添加一个明显的标记
    if (sectionTitle) {
      previewImageContext.value = `【所在小节】: ${sectionTitle}\n\n${contextLines.join('\n')}`;
    } else {
      previewImageContext.value = contextLines.join('\n');
    }
    
    // 如果找到了图片路径，显示预览
    if (imageSrc) {
      showImageWithPath(imageSrc);
    } else {
      previewImageContext.value += '\n\n无法在上下文中找到图片链接';
    }
  };
  
  // 获取章节内容
  const fetchSectionContent = async (fileId: number): Promise<string | null> => {
    try {
      // 调试：打印 fileId 信息
      console.log(`开始获取章节内容，fileId: ${fileId} (类型: ${typeof fileId})`);
      
      // 只使用正确的 API 路径（根据后端实现）
      const url = `http://localhost:8080/api/files/markdown/${fileId}/content`;
      console.log('请求章节内容 URL:', url);
      
      try {
          const response = await axios.get(url);
        console.log('章节内容 API 响应:', response);
        
          const data = response.data as ContentResponse;
          
        // 后端返回的数据结构可能是 { content: "...", fileInfo: {...} } 或 { content: "..." }
          if (data && data.content) {
          console.log('成功获取章节内容，长度:', data.content.length);
            return data.content;
        } else if (response.data && typeof response.data === 'object') {
          // 尝试从不同的字段获取内容
          const content = (response.data as any).content || (response.data as any).data?.content;
          if (content) {
            console.log('从响应数据中提取内容，长度:', content.length);
            return content;
          }
        }
        
        console.warn('响应中没有找到 content 字段:', response.data);
      } catch (err: any) {
        console.error(`获取章节内容失败 (fileId: ${fileId}):`, err);
        if (err.response) {
          console.error('错误响应状态:', err.response.status);
          console.error('错误响应数据:', err.response.data);
        }
        throw err; // 重新抛出错误，让调用者处理
      }
      
      // 如果所有URL都失败，但我们有章节信息，则尝试从章节信息中提取内容
      if (selectedBook.value) {
        // 查找对应的章节和小节
        for (const chapter of selectedBook.value.chapters) {
          if (chapter.sections) {
            for (const section of chapter.sections) {
              if (section.fileId === fileId && section.content) {
                console.log('从章节信息中提取内容');
                return section.content;
              }
            }
          }
        }
      }
      
      // 如果API请求失败且没有找到章节内容，生成一个模拟内容用于演示
      console.warn('无法获取章节内容，生成模拟内容');
      return generateMockContent(fileId);
    } catch (err) {
      console.error('获取章节内容失败:', err);
      return generateMockContent(fileId);
    }
  };
  
  // 生成模拟内容用于演示
  const generateMockContent = (fileId: number): string => {
    // 查找对应的章节和小节标题
    let chapterTitle = '未知章节';
    let sectionTitle = '未知小节';
    
    if (selectedBook.value) {
      for (const chapter of selectedBook.value.chapters) {
        if (chapter.sections) {
          for (const section of chapter.sections) {
            if (section.fileId === fileId) {
              chapterTitle = chapter.title;
              sectionTitle = section.title;
              break;
            }
          }
        }
      }
    }
    
    // 生成一些模拟的Markdown内容
    return `# ${sectionTitle}

## 简介
这是${chapterTitle}中的${sectionTitle}的模拟内容。

## 主要内容
这部分将包含该小节的主要内容。

### 子主题1
这是第一个子主题的内容。

### 子主题2
这是第二个子主题的内容。

### 子主题3
这是第三个子主题的内容。

## 总结
这是${sectionTitle}的总结部分。

`;
  };
  
  // 显示图片
  const showImageWithPath = (imageSrc: string) => {
    // 重置图片加载状态
    imageLoading.value = true;
    imageError.value = '';
    lastImageSrc.value = imageSrc;
    
    // 处理相对路径
    let processedSrc = imageSrc;
    
    try {
      // 检查是否是有效的URL
      if (processedSrc.startsWith('./') || processedSrc.startsWith('../') || 
          (!processedSrc.startsWith('http') && !processedSrc.startsWith('data:'))) {
        // 假设图片路径是相对于API服务器的
        // 移除开头的./或../
        processedSrc = processedSrc.replace(/^\.\//, '').replace(/^\.\.\//, '');
        
        // 添加API服务器前缀
        // 使用配置或环境变量中的API URL，如果没有则使用默认值
        const apiBaseUrl = 'http://localhost:8080/';
        processedSrc = `${apiBaseUrl}${processedSrc}`;
        
        console.log('处理后的图片URL:', processedSrc);
      }
      
      // 设置预览图片URL
      previewImageUrl.value = processedSrc;
      showImagePreview.value = true;
    } catch (err) {
      console.error('处理图片路径时出错:', err);
      imageError.value = `处理图片路径时出错: ${err instanceof Error ? err.message : String(err)}`;
      previewImageUrl.value = imageSrc; // 使用原始路径作为备用
      showImagePreview.value = true;
    }
  };
  
  // 处理图片加载成功
  const handleImageLoaded = () => {
    console.log('图片加载成功:', previewImageUrl.value);
    imageLoading.value = false;
    imageError.value = '';
  };
  
  // 处理图片加载失败
  const handleImageError = () => {
    console.error('图片加载失败:', previewImageUrl.value);
    imageLoading.value = false;
    imageError.value = '图片无法加载，请检查图片路径或网络连接';
    
    // 尝试使用备用路径（如果原始路径是相对路径）
    if (lastImageSrc.value && !previewImageUrl.value.includes(lastImageSrc.value)) {
      console.log('尝试使用原始路径:', lastImageSrc.value);
      previewImageUrl.value = lastImageSrc.value;
    }
  };
  
  // 重试加载图片
  const retryLoadImage = () => {
    imageLoading.value = true;
    imageError.value = '';
    
    // 强制重新加载图片
    const currentSrc = previewImageUrl.value;
    previewImageUrl.value = '';
    
    // 使用setTimeout确保DOM更新
    setTimeout(() => {
      previewImageUrl.value = currentSrc;
    }, 100);
  };
  
  // 复制图片URL到剪贴板
  const copyImageUrl = () => {
    try {
      navigator.clipboard.writeText(previewImageUrl.value)
        .then(() => {
          alert('图片URL已复制到剪贴板');
        })
        .catch(err => {
          console.error('复制URL失败:', err);
          alert('复制URL失败: ' + err);
        });
    } catch (err) {
      console.error('复制URL失败:', err);
      alert('复制URL失败: ' + err);
      
      // 备用方法
      const textarea = document.createElement('textarea');
      textarea.value = previewImageUrl.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('图片URL已复制到剪贴板 (备用方法)');
    }
  };
  
  // 预览图片（从原文中点击）
  const previewImage = (event: Event, src: string, alt: string) => {
    // 处理相对路径
    let imageSrc = src;
    if (imageSrc.startsWith('./') || imageSrc.startsWith('../') || !imageSrc.startsWith('http')) {
      // 假设图片路径是相对于API服务器的
      imageSrc = `http://localhost:8080/${imageSrc.replace(/^\.\//, '')}`;
    }
    
    previewImageUrl.value = imageSrc;
    previewImageTitle.value = alt || '图片预览';
    
    // 获取上下文（图片前后几行文本）
    const clickedElement = event.target as HTMLElement;
    const preElement = clickedElement.closest('pre');
    if (preElement) {
      const text = preElement.textContent || '';
      const lines = text.split('\n');
      
      // 找到包含图片链接的行
      const imageLine = lines.findIndex(line => line.includes(`![${alt}](${src})`));
      if (imageLine >= 0) {
        // 向上查找最近的小节标题
        let sectionTitle = '';
        let sectionLineIndex = -1;
        
        // 向上最多查找20行，寻找小节标题
        for (let j = imageLine; j >= Math.max(0, imageLine - 20); j--) {
          const line = lines[j].trim();
          
          // 跳过空行和当前图片标题行
          if (line === '' || line.includes(`![${alt}](${src})`)) {
            continue;
          }
          
          // 匹配Markdown标题格式（# 或 ## 或 ### 等）
          if (/^#{1,6}\s+.+/.test(line) && !line.includes('图') && !line.includes('表')) {
            sectionLineIndex = j;
            sectionTitle = line.replace(/^#{1,6}\s+/, '').trim();
            break;
          }
          
          // 匹配数字编号格式（如 1.1.2.1）
          // 确保这不是图表编号（不包含"图"或"表"）
          if (/^\d+(\.\d+)*\s+.+/.test(line) && !line.includes('图') && !line.includes('表')) {
            sectionLineIndex = j;
            sectionTitle = line.trim();
            break;
          }
          
          // 如果遇到另一个图表标题，继续向上查找
          if (line.startsWith('图') || line.startsWith('表')) {
            continue;
          }
        }
        
        // 设置上下文范围
        let contextStart, contextEnd;
        if (sectionLineIndex !== -1) {
          // 如果找到了小节标题，从标题开始显示
          contextStart = sectionLineIndex;
          // 确保上下文包含图片行
          contextEnd = Math.min(lines.length - 1, imageLine + 3);
        } else {
          // 如果没找到小节标题，就只显示图片周围的内容
          contextStart = Math.max(0, imageLine - 3);
          contextEnd = Math.min(lines.length - 1, imageLine + 3);
        }
        
        // 提取上下文
        const contextLines = lines.slice(contextStart, contextEnd + 1);
        
        // 如果找到了小节标题，在上下文开头添加一个明显的标记
        if (sectionTitle) {
          previewImageContext.value = `【所在小节】: ${sectionTitle}\n\n${contextLines.join('\n')}`;
        } else {
          // 尝试从当前选中的章节和小节获取标题
          if (hasSelectedSection.value && selectedBook.value) {
            const currentSectionTitle = selectedBook.value.chapters[selectedChapter.value].sections[selectedSection.value].title;
            previewImageContext.value = `【所在小节】: ${currentSectionTitle}\n\n${contextLines.join('\n')}`;
          } else {
            previewImageContext.value = contextLines.join('\n');
          }
        }
      } else {
        previewImageContext.value = '';
      }
    } else {
      previewImageContext.value = '';
    }
    
    showImagePreview.value = true;
  };
  
  // 关闭图片预览
  const closeImagePreview = () => {
    showImagePreview.value = false;
    previewImageUrl.value = '';
    previewImageTitle.value = '';
    previewImageContext.value = '';
  };
  
  // 组件挂载时获取 Markdown 文件
  onMounted(async () => {
    // 初始化书籍数据
    if (props.book) {
        selectedBook.value = props.book;
        
        // 确保封面URL正确
        if (selectedBook.value && !selectedBook.value.coverUrl.startsWith('http')) {
          // 如果不是绝对URL，确保路径正确
          if (!selectedBook.value.coverUrl.startsWith('/')) {
            selectedBook.value.coverUrl = '/' + selectedBook.value.coverUrl;
          }
        }
        
      // 对于所有书籍，都尝试从后端获取 Markdown 文件
      try {
        const bookId = typeof props.book.id === 'string' ? parseInt(props.book.id) : props.book.id;
        console.log(`组件挂载，开始获取书籍 ${bookId} (${props.book.title}) 的 Markdown 文件`);
        await fetchAllMarkdownFiles();
      } catch (err) {
        console.error('获取 Markdown 文件失败:', err);
        // 如果获取失败，使用预设数据（如果有）
        console.log('使用预设的书籍数据:', props.book);
        
        // 如果预设数据中没有 chapters，显示提示
        if (!selectedBook.value.chapters || selectedBook.value.chapters.length === 0) {
          error.value = '该书籍暂无内容，请先在文件管理中心上传文件';
        }
      }
      
      // 默认展开第一章
      if (selectedBook.value && selectedBook.value.chapters && selectedBook.value.chapters.length > 0) {
        expandedChapters.value[0] = true;
      }
    } else {
      // 如果没有传入书籍，创建一个默认书籍并尝试获取数据
      console.log('未传入书籍，使用默认书籍ID=1');
      try {
        await fetchAllMarkdownFiles();
      } catch (err) {
        console.error('获取默认书籍数据失败:', err);
        error.value = '无法加载书籍数据，请稍后重试';
      }
    }
    
    // 添加全局方法用于从原文中点击图片
    (window as any).previewImage = previewImage;
  });
  
  // 在组件卸载时，移除全局方法
  onUnmounted(() => {
    // 移除全局方法
    if ((window as any).previewImage) {
      delete (window as any).previewImage;
    }
  });
  
  // 超细化目录相关状态
  const showDetailedToc = ref(false);
  const detailedToc = ref<any[]>([]);
  const expandedDetailedChapters = ref<Record<number, boolean>>({});
  const expandedDetailedSections = ref<Record<string, boolean>>({});
  const generatingDetailedToc = ref(false);
  const detailedTocError = ref('');
  const detailedTocProgress = ref(0);
  const originalTocDepth = ref(0);
  const detailedTocDepth = ref(0);
  
  // 切换超细化目录章节的展开/折叠状态
  const toggleDetailedChapter = (chapterIndex: number) => {
    expandedDetailedChapters.value[chapterIndex] = !expandedDetailedChapters.value[chapterIndex];
  };
  
  // 切换超细化目录小节的展开/折叠状态
  const toggleDetailedSection = (chapterTitle: string, sectionIndex: number) => {
    const key = `${chapterTitle}-${sectionIndex}`;
    expandedDetailedSections.value[key] = !expandedDetailedSections.value[key];
  };
  
  // 检查超细化目录小节是否展开
  const isDetailedSectionExpanded = (chapterTitle: string, sectionIndex: number) => {
    const key = `${chapterTitle}-${sectionIndex}`;
    return !!expandedDetailedSections.value[key];
  };
  
  // 生成超细化目录
  const generateDetailedToc = async () => {
    if (!selectedBook.value || !selectedBook.value.chapters) {
      console.error('没有选中的书籍或章节');
      return;
    }
    
    showDetailedToc.value = true;
    generatingDetailedToc.value = true;
    detailedTocError.value = '';
    detailedTocProgress.value = 0;
    
    try {
      // 计算原有目录的最大深度
      originalTocDepth.value = calculateTocDepth(selectedBook.value.chapters);
      
      // 初始化详细目录数据结构
      detailedToc.value = JSON.parse(JSON.stringify(selectedBook.value.chapters));
      
      // 为每个章节和小节获取超细化目录
      const totalChapters = detailedToc.value.length;
      
      for (let i = 0; i < detailedToc.value.length; i++) {
        const chapter = detailedToc.value[i];
        expandedDetailedChapters.value[i] = true;
        
        // 为每个小节获取超细化目录
        if (chapter.sections) {
          for (let j = 0; j < chapter.sections.length; j++) {
            const section = chapter.sections[j];
            
            // 更新进度
            detailedTocProgress.value = Math.floor((i / totalChapters) * 100);
            
            if (section.fileId) {
              // 获取超细化目录
              const detailedTocResult = await fetchDetailedToc(section.fileId);
              if (detailedTocResult && detailedTocResult.toc) {
                // 预处理目录数据，确保所有属性都存在
                const processedToc = detailedTocResult.toc.map((item: any) => {
                  // 传递原始数据不做修改，确保所有API返回的数据都显示
                  return item;
                });
                
                // 将处理后的超细化目录添加到小节中
                section.detailedToc = processedToc;
                console.log(`章节 ${chapter.title} 的小节 ${section.title} 的超细化目录:`, section.detailedToc);
              }
            }
          }
        }
      }
      
      // 计算生成的目录的最大深度
      detailedTocDepth.value = calculateDetailedTocDepth(detailedToc.value);
      
      generatingDetailedToc.value = false;
      detailedTocProgress.value = 100;
    } catch (err) {
      console.error('生成超细化目录失败:', err);
      detailedTocError.value = `生成超细化目录失败: ${err instanceof Error ? err.message : String(err)}`;
      generatingDetailedToc.value = false;
    }
  };
  
  // 从内容生成深层级目录
  const generateDeepTocFromContent = async (content: string, existingToc?: TocItem[]): Promise<any[]> => {
    // 这里是AI分析内容生成深层级目录的逻辑
    console.log('开始生成深层级目录，内容长度:', content?.length || 0);
    console.log('原始目录项数量:', existingToc?.length || 0);
    
    const lines = content.split('\n');
    let result: any[] = [];
    
    // 第一步：如果存在原始目录，先完整保留原始目录结构（不包括图表项）
    if (existingToc && existingToc.length > 0) {
      // 过滤掉图表项
      const filteredToc = existingToc.filter(item => {
        // 排除图表项
        const title = item.title?.trim() || '';
        const prefix = item.numericPrefix?.trim() || '';
        
        // 检查是否为图片（通过isImage属性）
        if (item.isImage) return false;
        
        // 检查标题是否以"图"或"表"开头
        if (title.startsWith('图') || title.startsWith('表')) return false;
        
        // 检查numericPrefix是否以"图"或"表"开头
        if (prefix.startsWith('图') || prefix.startsWith('表')) return false;
        
        // 检查是否包含图片链接格式 ![](...)
        if (title.includes('![') && title.includes('](') && title.includes(')')) return false;
        
        // 检查是否匹配"图x.x"或"表x.x"的格式（使用正则表达式）
        const imageRegex = /^(图|表)\s*\d+(\.\d+)*\s*[:：]?/;
        if (imageRegex.test(title)) return false;
        
        // 检查是否包含"图"或"表"字样，且包含数字（更宽松的匹配）
        if ((title.includes('图') || title.includes('表')) && /\d/.test(title)) return false;
        
        return true;
      });
      
      console.log('过滤后的目录项数量:', filteredToc.length);
      
      // 将过滤后的原始目录转换为新的目录结构
      result = filteredToc.map(item => ({
        title: item.numericPrefix ? `${item.numericPrefix} ${item.title}` : item.title,
        level: item.level,
        originalItem: true,
        children: [] // 将在后续步骤中填充
      }));
    }
    
    // 识别潜在的标题和子主题
    let currentTopic: string | null = null;
    let subTopics: any[] = [];
    let currentSection: any = null;
    
    // 创建标题映射，用于将新识别的内容添加到正确的原始目录项下
    const titleToItemMap = new Map();
    if (result.length > 0) {
      result.forEach(item => {
        titleToItemMap.set(item.title, item);
      });
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行
      if (!line) continue;
      
      // 跳过图表相关行
      if (line.startsWith('图') || line.startsWith('表') || 
          line.includes('![') && line.includes('](') && line.includes(')')) {
        continue;
      }
      
      // 检查是否是已有的标题（Markdown标题格式）
      if (/^#{1,6}\s+.+/.test(line)) {
        const headingLevel = line.match(/^(#+)/)?.[0].length || 0;
        const headingText = line.replace(/^#{1,6}\s+/, '');
        
        // 检查这个标题是否已经在原始目录中
        const existingItem = Array.from(titleToItemMap.keys()).find(title => 
          title.includes(headingText) || headingText.includes(title)
        );
        
        if (existingItem) {
          // 如果标题已存在于原始目录，将其设为当前部分
          currentSection = titleToItemMap.get(existingItem);
          
          // 如果有当前主题，保存它和它的子主题
          if (currentTopic && subTopics.length > 0 && !currentSection) {
            result.push({
              title: currentTopic,
              level: headingLevel,
              children: subTopics
            });
          }
          
          // 重置当前主题
          currentTopic = null;
          subTopics = [];
        } else {
          // 如果标题不在原始目录中，将其作为新主题
          // 如果有当前主题，保存它和它的子主题
          if (currentTopic && subTopics.length > 0) {
            const newItem = {
              title: currentTopic,
              level: headingLevel,
              children: subTopics
            };
            
            // 如果有当前部分，将新项添加到其子项中
            if (currentSection) {
              currentSection.children.push(newItem);
            } else {
              result.push(newItem);
            }
          }
          
          // 开始新主题
          currentTopic = headingText;
          subTopics = [];
        }
        continue;
      }
      
      // 检查是否是潜在的子主题（基于句子结构和长度）
      if (line.length > 10 && line.length < 100 && /[.。!！?？]$/.test(line)) {
        // 这可能是一个重要的句子，将其作为子主题
        subTopics.push({
          title: line,
          children: []
        });
        
        // 限制每个主题的子主题数量，避免目录过于庞大
        if (subTopics.length >= 5) {
          // 如果有当前主题，保存它和它的子主题
          if (currentTopic) {
            const newItem = {
              title: currentTopic,
              children: subTopics
            };
            
            // 如果有当前部分，将新项添加到其子项中
            if (currentSection) {
              currentSection.children.push(newItem);
            } else {
              result.push(newItem);
            }
          }
          
          // 开始新主题
          currentTopic = "继续阅读...";
          subTopics = [];
        }
      }
    }
    
    // 添加最后一个主题
    if (currentTopic && subTopics.length > 0) {
      const newItem = {
        title: currentTopic,
        children: subTopics
      };
      
      // 如果有当前部分，将新项添加到其子项中
      if (currentSection) {
        currentSection.children.push(newItem);
      } else {
        result.push(newItem);
      }
    }
    
    return result;
  };
  
  // 计算原有目录的最大深度
  const calculateTocDepth = (chapters: any[]): number => {
    let maxDepth = 1; // 章节是第一级
    
    for (const chapter of chapters) {
      if (chapter.sections && chapter.sections.length > 0) {
        maxDepth = Math.max(maxDepth, 2); // 小节是第二级
        
        for (const section of chapter.sections) {
          if (section.toc && section.toc.length > 0) {
            let sectionMaxDepth = 0;
            
            for (const item of section.toc) {
              sectionMaxDepth = Math.max(sectionMaxDepth, item.level || 0);
            }
            
            maxDepth = Math.max(maxDepth, 2 + sectionMaxDepth);
          }
        }
      }
    }
    
    return maxDepth;
  };
  
  // 计算生成的目录的最大深度
  const calculateDetailedTocDepth = (items: any[]): number => {
    let maxDepth = 0;
    
    const calculateDepth = (items: any[], currentDepth: number) => {
      for (const item of items) {
        maxDepth = Math.max(maxDepth, currentDepth);
        
        // 检查是否有详细目录项
        if (item.detailedToc && Array.isArray(item.detailedToc)) {
          // 创建一个集合用于去重
          const titleSet = new Set<string>();
          
          for (const tocItem of item.detailedToc) {
            // 使用标题作为唯一标识
            if (!titleSet.has(tocItem.title)) {
              titleSet.add(tocItem.title);
              maxDepth = Math.max(maxDepth, currentDepth + tocItem.level);
              
              // 检查是否有子项
              if (tocItem.items && Array.isArray(tocItem.items)) {
                maxDepth = Math.max(maxDepth, currentDepth + tocItem.level + 1);
              }
            }
          }
        }
        
        // 递归检查子节点
        if (item.sections && Array.isArray(item.sections)) {
          calculateDepth(item.sections, currentDepth + 1);
        }
      }
    };
    
    calculateDepth(items, 1);
    return maxDepth;
  };
  
  // 关闭超细化目录弹窗
  const closeDetailedToc = () => {
    showDetailedToc.value = false;
  };
  
  // 选择超细化目录项
  const selectDetailedTocItem = (item: any) => {
    // 这里可以实现点击超细化目录项后的跳转逻辑
    console.log('选择超细化目录项:', item);
    
    // 关闭超细化目录弹窗
    closeDetailedToc();
  };
  
  // 导出超细化目录
  const exportDetailedToc = () => {
    if (!detailedToc.value || detailedToc.value.length === 0) return;
    
    // 生成Markdown格式的超细化目录
    let markdown = '# 超细化目录\n\n';
    
    // 遍历章节
    for (const chapter of detailedToc.value) {
      markdown += `## ${chapter.title}\n\n`;
      
      // 遍历小节
      if (chapter.sections) {
        for (const section of chapter.sections) {
          markdown += `### ${section.title}\n\n`;
          
          // 遍历详细目录项
          if (section.detailedToc) {
            // 按类型分组目录项
            const headings = section.detailedToc.filter(item => !item.isSpecialTitle);
            const specialTitles = section.detailedToc.filter(item => item.isSpecialTitle);
            const figures = specialTitles.filter(item => item.contentType === 'image');
            const tables = specialTitles.filter(item => item.contentType === 'table');
            
            // 先添加正常标题
            for (const item of headings) {
              const indent = '  '.repeat(item.level - 1);
              let titleLine = `${indent}- `;
              
              // 添加标题前缀
              if (item.numericPrefix) {
                titleLine += `${item.numericPrefix} `;
              } else if (item.type === 'numbered') {
                titleLine += `(${item.number}) `;
              } else if (item.type === 'lettered') {
                titleLine += `(${item.letter}) `;
              }
              
              // 添加标题
              titleLine += item.title;
              markdown += `${titleLine}\n`;
              
              // 添加子项
              if (item.items && item.items.length > 0) {
                for (const subItem of item.items) {
                  const subIndent = '  '.repeat(item.level);
                  let subTitleLine = `${subIndent}- `;
                  
                  // 添加子项前缀
                  if (subItem.numericPrefix) {
                    subTitleLine += `${subItem.numericPrefix} `;
                  } else if (subItem.type === 'numbered') {
                    subTitleLine += `(${subItem.number}) `;
                  } else if (subItem.type === 'lettered') {
                    subTitleLine += `(${subItem.letter}) `;
                  }
                  
                  // 添加子项标题
                  subTitleLine += subItem.title;
                  markdown += `${subTitleLine}\n`;
                }
              }
            }
            
            // 然后添加图表（如果有）
            if (figures.length > 0) {
              markdown += '\n#### 图目录\n\n';
              for (const figure of figures) {
                markdown += `- ${figure.title}\n`;
              }
              markdown += '\n';
            }
            
            if (tables.length > 0) {
              markdown += '\n#### 表目录\n\n';
              for (const table of tables) {
                markdown += `- ${table.title}\n`;
              }
              markdown += '\n';
            }
          }
        }
      }
    }
    
    // 创建下载链接
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '超细化目录.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 获取超细化目录的API调用函数
  const fetchDetailedToc = async (fileId: number) => {
    try {
      console.log(`开始获取文件 ID ${fileId} 的超细化目录...`);
      const url = `http://localhost:8080/api/files/markdown/${fileId}/detailed-toc`;
      console.log('请求 URL:', url);
      
      const response = await axios.get(url);
      console.log('API 响应:', response);
      
      interface DetailedTocItem {
        level: number;
        title: string;
        type: 'heading' | 'numbered' | 'lettered' | 'extracted';
        numericPrefix?: string;
        number?: string;
        letter?: string;
        items?: DetailedTocItem[];
        contentType?: 'image' | 'table';
        isSpecialTitle?: boolean;
        isSubItem?: boolean;
        fullText?: string;
      }
      
      interface DetailedTocResponse {
        fileInfo?: {
          id: number;
          property: string;
          file_path: string;
        };
        toc?: DetailedTocItem[];
        error?: string;
      }
      
      const data = response.data as DetailedTocResponse;
      
      if (data && data.toc) {
        console.log('成功获取超细化目录:', data.toc);
        
        // 检查是否有提取的子项
        let hasExtractedItems = false;
        const checkForExtractedItems = (items: any[]) => {
          for (const item of items) {
            if (item.items && item.items.length > 0) {
              hasExtractedItems = true;
              console.log(`发现子项: ${item.title} 有 ${item.items.length} 个子项`);
              for (const subItem of item.items) {
                console.log(`  子项: ${subItem.type} - ${subItem.title}`);
              }
            }
          }
        };
        
        if (data.toc) {
          checkForExtractedItems(data.toc);
        }
        
        if (!hasExtractedItems) {
          console.warn('警告：没有发现从冒号后提取的子项，请检查后端数据结构');
        }
        
        return data;
      } else {
        console.error('API 响应格式不符合预期:', response.data);
        return null;
      }
    } catch (err: any) {
      console.error(`获取文件 ID ${fileId} 的超细化目录失败:`, err);
      return null;
    }
  };
  
  // 添加新的状态管理
  const expandedDetailedItems = ref<Record<string, boolean>>({});
  
  // 切换详细目录项的展开/折叠状态
  const toggleDetailedItem = (chapterTitle: string, sectionIndex: number, itemIndex: number) => {
    const key = `${chapterTitle}-${sectionIndex}-${itemIndex}`;
    
    // 获取当前展开状态
    const isCurrentlyExpanded = expandedDetailedItems.value[key];
    
    // 如果是第一次展开，尝试处理子项
    if (!isCurrentlyExpanded && detailedToc.value) {
      try {
        const chapter = detailedToc.value.find(ch => ch.title === chapterTitle);
        if (chapter && chapter.sections && chapter.sections[sectionIndex]) {
          const section = chapter.sections[sectionIndex];
          if (section.detailedToc && section.detailedToc[itemIndex]) {
            const item = section.detailedToc[itemIndex];
            
            // 调试输出
            console.log('展开项的数据:', item);
            
            // 检查并输出子项内容
            if (item.items && item.items.length > 0) {
              console.log(`项目"${item.title}"已有${item.items.length}个子项:`, item.items);
            } else {
              console.log(`项目"${item.title}"没有子项`);
              
              // 只有在没有子项的情况下才尝试从fullText提取
              if (item.fullText && !item._hasProcessedColonContent) {
                const colonIndex = item.fullText.indexOf('：');
                const englishColonIndex = item.fullText.indexOf(':');
                const effectiveColonIndex = colonIndex >= 0 ? colonIndex : englishColonIndex;
                
                if (effectiveColonIndex >= 0) {
                  const description = item.fullText.substring(effectiveColonIndex + 1).trim();
                  
                  if (description) {
                    console.log('从fullText中提取描述:', description);
                    
                    // 根据句号、分号等分割句子
                    const sentences = description.split(/[。；;]/);
                    const extractedItems: Array<any> = [];
                    
                    for (let i = 0; i < sentences.length; i++) {
                      const sentence = sentences[i].trim();
                      if (!sentence) continue;
                      
                      // 跳过包含图表引用的句子
                      if ((sentence.includes('图') && sentence.match(/.*图\s*\d+.*/)) ||
                          (sentence.includes('表') && sentence.match(/.*表\s*\d+.*/))) {
                        continue;
                      }
                      
                      // 为每个句子创建一个子项
                      const prefix = item.type === 'numbered' ? 
                        `${item.number}.${i+1}` : 
                        (item.type === 'lettered' ? `${item.letter}.${i+1}` : `${i+1}`);
                      
                      extractedItems.push({
                        level: item.level + 1,
                        title: sentence,
                        numericPrefix: prefix,
                        type: 'extracted',
                        isSubItem: true
                      });
                    }
                    
                    if (extractedItems.length > 0) {
                      // 创建一个类型为any的数组
                      item.items = extractedItems as any[];
                      // 标记为已处理冒号内容
                      item._hasProcessedColonContent = true;
                      
                      console.log('提取了子项:', extractedItems);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('处理展开详细目录项时出错:', err);
      }
    }
    
    // 切换展开状态
    expandedDetailedItems.value[key] = !expandedDetailedItems.value[key];
  };
  
  // 检查详细目录项是否展开
  const isDetailedItemExpanded = (chapterTitle: string, sectionIndex: number, itemIndex: number) => {
    const key = `${chapterTitle}-${sectionIndex}-${itemIndex}`;
    return !!expandedDetailedItems.value[key];
  };
  
  // 检查是否为图表标题
  const isFigureTitle = (title: string) => {
    if (typeof title !== 'string') return false;
    return title.trim().startsWith('图') || 
           (title.includes('图') && title.match(/.*图\s*\d+.*/));
  };
  
  // 检查是否为表格标题
  const isTableTitle = (title: string) => {
    if (typeof title !== 'string') return false;
    return title.trim().startsWith('表') || 
           (title.includes('表') && title.match(/.*表\s*\d+.*/));
  };
  
  // 检查是否有子项
  const hasSubItems = (item: any) => {
    return item && item.items && Array.isArray(item.items) && item.items.length > 0;
  };
  
  // 获取唯一的目录项（但保留子项）
  const getUniqueItems = (items: any[]) => {
    if (!items || !Array.isArray(items)) return [];
    
    const titleMap = new Map();
    const result: any[] = [];
    
    // 对于每个项，检查是否已经添加过相同标题的项
    items.forEach((item, index) => {
      const key = item.title;
      
      if (!titleMap.has(key)) {
        // 如果这是第一次看到这个标题，添加它
        titleMap.set(key, true);
        // 存储原始索引以便于事件处理
        item._originalIndex = index;
        result.push(item);
      } else if (item.fullText && !result.find((r: any) => r.fullText === item.fullText)) {
        // 如果fullText不同，也添加这个项
        titleMap.set(key + '-' + item.fullText, true);
        item._originalIndex = index;
        result.push(item);
      }
    });
    
    return result;
  };
  
  // 获取子项（不做去重，保留所有API返回的子项）
  const getUniqueSubItems = (items: any[]) => {
    // 直接返回原始子项，不做去重
    return items || [];
  };
  
  // 新增三栏布局相关状态
  const catalogTab = ref<'book'|'figure'|'table'|'citation'>('book');
  
  // 图/表目录数据（基于后端返回的图片列表）
  const figureCatalog = computed(() => {
    // 使用后端返回的图片列表
    if (!sectionImages.value || sectionImages.value.length === 0) return [];
    
    // 过滤出图片文件（排除非图片文件）
    return sectionImages.value
      .filter(img => {
        const name = img.name || '';
        const url = img.url || '';
        // 检查是否为图片文件
        return /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(name) || 
               /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(url);
      })
      .map(img => ({
        title: img.name || '未命名图片',
        url: img.url || '',
        id: img.name || img.url || ''
      }));
  });
  
  const tableCatalog = computed(() => {
    if (!hasSelectedSection.value || !selectedBook.value) return [];
    const curSection = selectedBook.value.chapters[selectedChapter.value].sections[selectedSection.value];
    if (!curSection.content) return [];
    return extractFigureOrTableCatalog(curSection.content, 'table');
  });
  
  // 提取图片上下紧邻的"图x.x..."或"表x.x..."标题
  function extractFigureOrTableCatalog(content: string, type: 'figure'|'table') {
    const lines = content.split(/\r?\n/);
    const result: { title: string, imageLine: number, id: string }[] = [];
    const imgRegex = /^!\[.*?\]\(.*?\)/;
    const figTitleRegex = /^图\s*\d+(\.\d+)*[\s:：]?.*/;
    const tabTitleRegex = /^表\s*\d+(\.\d+)*[\s:：]?.*/;
    for (let i = 0; i < lines.length; i++) {
      if (imgRegex.test(lines[i].trim())) {
        // 检查上一行和下一行（允许有空行）
        let prev = i - 1, next = i + 1;
        let prevTitle = '', nextTitle = '';
        // 向上找第一个非空行
        while (prev >= 0 && lines[prev].trim() === '') prev--;
        if (prev >= 0) prevTitle = lines[prev].trim();
        // 向下找第一个非空行
        while (next < lines.length && lines[next].trim() === '') next++;
        if (next < lines.length) nextTitle = lines[next].trim();
        // 判断类型
        if (type === 'figure' && figTitleRegex.test(prevTitle)) {
          result.push({ title: prevTitle, imageLine: i, id: prevTitle + '_' + i });
        } else if (type === 'figure' && figTitleRegex.test(nextTitle)) {
          result.push({ title: nextTitle, imageLine: i, id: nextTitle + '_' + i });
        } else if (type === 'table' && tabTitleRegex.test(prevTitle)) {
          result.push({ title: prevTitle, imageLine: i, id: prevTitle + '_' + i });
        } else if (type === 'table' && tabTitleRegex.test(nextTitle)) {
          result.push({ title: nextTitle, imageLine: i, id: nextTitle + '_' + i });
        }
      }
    }
    // 去重（同一标题只保留一次）
    const seen = new Set();
    return result.filter(item => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    });
  }
  
  // 中间区展示内容
  const centerType = ref<'figure'|'table'|'citation'|''>('');
  const centerFigureUrl = ref('');
  const centerTableHtml = ref('');
  
  function selectFigure(item: any) {
    centerType.value = 'figure';
    selectedFigureTitle.value = item.title;
    
    // 使用后端返回的完整URL，并用encodeURI处理
    if (item.url) {
      let imgUrl = item.url;
      if (imgUrl.startsWith('/')) {
        imgUrl = `http://localhost:8080${encodeURI(imgUrl)}`;
      }
      centerFigureUrl.value = imgUrl;
    } else {
      // 备用方案
      let chapterNo = '';
      if (hasSelectedSection.value && selectedBook.value) {
        const section = selectedBook.value.chapters[selectedChapter.value].sections[selectedSection.value];
        const match = section.title.match(/^(\d+(?:\.\d+)*)(\s|$)/);
        if (match) chapterNo = match[1];
      }
      const imgUrl = `http://localhost:8080/uploads/images/${chapterNo}/${encodeURI(item.title)}`;
      centerFigureUrl.value = imgUrl;
    }
    
    // 提取图片编号并获取上下文
    extractFigureContext(item);
  }
  function selectTable(item: any) {
    centerType.value = 'table';
    centerTableHtml.value = item.html || item.title;
  }
  
  // 引文相关事件处理
  const onCitationSelected = (citation: any) => {
    console.log('选中引文:', citation);
    // 可以在这里添加额外的逻辑，比如更新中间栏显示
  };

  const onReferenceClicked = async (reference: any) => {
    console.log('点击引用位置:', reference);
    
    // 1. 如果原文未打开，则自动打开
    if (!showOriginalContent.value) {
      await fetchOriginalContent(selectedChapter.value, selectedSection.value);
    }
    
    // 2. 等待DOM更新
    await nextTick();
    
    // 3. 使用引用的完整上下文进行匹配（而不是只用citationText）
    const contextToMatch = reference.context;  // 使用完整的上下文句子
    const citationText = reference.citationText;
    
    if (!contextToMatch && !citationText) {
      console.warn('引用上下文和引用文本均为空，无法定位');
      return;
    }
    
    console.log('查找目标:', { 上下文: contextToMatch, 引用标注: citationText });
    
    // 策略1: 先用完整上下文匹配（最准确）
    let targetSentenceIndex = -1;
    if (contextToMatch && contextToMatch.length > 10) {
      // 提取上下文的关键部分（去掉引用标注本身）
      const contextWithoutCitation = contextToMatch.replace(/[\[\(（［][^\]\)）］]*[\]\)）］]/g, '').trim();
      
      for (let i = 0; i < processedSentences.value.length; i++) {
        const sentence = processedSentences.value[i];
        if (sentence.text && sentence.text.includes(contextWithoutCitation.substring(0, 30))) {
          targetSentenceIndex = i;
          console.log(`✓ 通过上下文匹配找到句子 [${i}]`);
          break;
        }
      }
    }
    
    // 策略2: 如果上下文匹配失败，使用引用标注匹配
    if (targetSentenceIndex === -1 && citationText) {
      for (let i = 0; i < processedSentences.value.length; i++) {
        const sentence = processedSentences.value[i];
        if (sentence.text && sentence.text.includes(citationText)) {
          targetSentenceIndex = i;
          console.log(`✓ 通过引用标注匹配找到句子 [${i}]`);
          break;
        }
      }
    }
    
    // 策略3: 模糊匹配（去掉所有标点和空格）
    if (targetSentenceIndex === -1) {
      console.warn('精确匹配失败，尝试模糊匹配...');
      const searchText = (contextToMatch || citationText).replace(/[\s\(\)\[\]（）［］【】，。！？；：、]/g, '');
      
      for (let i = 0; i < processedSentences.value.length; i++) {
        const sentence = processedSentences.value[i];
        const normalizedSentence = sentence.text.replace(/[\s\(\)\[\]（）［］【】，。！？；：、]/g, '');
        
        // 使用较长的匹配片段（至少20个字符）
        if (searchText.length > 20 && normalizedSentence.includes(searchText.substring(0, 20))) {
          targetSentenceIndex = i;
          console.log(`✓ 通过模糊匹配找到句子 [${i}]`);
          break;
        }
      }
    }
    
    if (targetSentenceIndex !== -1) {
      // 4. 高亮显示该句子
      if (!highlightedSentences.value.includes(targetSentenceIndex)) {
        highlightedSentences.value.push(targetSentenceIndex);
      }
      
      // 5. 滚动到该句子
      await nextTick();
      const element = document.getElementById(`sentence-${targetSentenceIndex}`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // 添加闪烁效果
        element.classList.add('citation-flash');
        setTimeout(() => {
          element.classList.remove('citation-flash');
        }, 2000);
        
        console.log(`✅ 成功跳转到句子 [${targetSentenceIndex}]: "${processedSentences.value[targetSentenceIndex].text.substring(0, 50)}..."`);
      } else {
        console.warn('未找到DOM元素:', `sentence-${targetSentenceIndex}`);
      }
    } else {
      console.error('❌ 所有匹配策略均失败');
      alert(`未找到引用在原文中的位置\n\n查找内容: ${contextToMatch || citationText}`);
    }
  };

  // 新增状态
  const selectedFigureTitle = ref('');
  const hoveredFigureTitle = ref('');

// ...
  
  // 新增：章节图片列表
  const sectionImages = ref<any[]>([]);
  const imagesLoading = ref(false);
  
  // 提取图片上下文的方法
  const extractFigureContext = async (item: any) => {
    // 重置上下文
    figureContextSectionTitle.value = '';
    figureContextText.value = '';
    
    if (!hasSelectedSection.value || !selectedBook.value) return;
    
    const section = selectedBook.value.chapters[selectedChapter.value].sections[selectedSection.value];
    if (!section.fileId) return;
    
    try {
      // 获取章节内容
      const content = await fetchSectionContent(section.fileId);
      if (!content) return;
      
      // 从图片标题中提取图片编号
      const figureNumber = extractFigureNumber(item.title);
      if (!figureNumber) return;
      
      // 在内容中查找图片编号并提取上下文
      const context = findFigureContextInContent(content, figureNumber, item.title);
      
      if (context) {
        figureContextSectionTitle.value = context.sectionTitle;
        figureContextText.value = context.contextText;
      }
    } catch (err) {
      console.error('提取图片上下文失败:', err);
    }
  };
  
  // 从图片标题中提取图片编号
  const extractFigureNumber = (title: string): string | null => {
    // 宽松匹配图片编号：图1.10、图 1.10、如图1.10所示等
    const patterns = [
      /图\s*(\d+(?:\.\d+)*)/,
      /如图\s*(\d+(?:\.\d+)*)/,
      /图\s*(\d+(?:\.\d+)*)\s*[:：]/
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  };
  
  // 在内容中查找图片编号并提取上下文
  const findFigureContextInContent = (content: string, figureNumber: string, figureTitle: string) => {
    const lines = content.split('\n');
    let imageLineIndex = -1;
    let sectionTitle = '';
    let sectionLineIndex = -1;
    
    // 查找包含图片编号的行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 宽松匹配图片编号（考虑空格、括号等）
      const patterns = [
        new RegExp(`图\\s*${figureNumber.replace(/\./g, '\\.')}`),
        new RegExp(`如图\\s*${figureNumber.replace(/\./g, '\\.')}`),
        new RegExp(`\\(图\\s*${figureNumber.replace(/\./g, '\\.')}\\)`),
        new RegExp(`图\\s*${figureNumber.replace(/\./g, '\\.')}\\s*[:：]`)
      ];
      
      const isMatch = patterns.some(pattern => pattern.test(line));
      if (isMatch) {
        imageLineIndex = i;
        break;
      }
    }
    
    if (imageLineIndex === -1) return null;
    
    // 向上查找最近的小节标题
    for (let j = imageLineIndex; j >= 0; j--) {
      const line = lines[j].trim();
      
      // 跳过空行和图片相关行
      if (line === '' || line.includes('图') || line.includes('![')) {
        continue;
      }
      
      // 匹配Markdown标题格式
      if (/^#{1,6}\s+.+/.test(line) && !line.includes('图') && !line.includes('表')) {
        sectionLineIndex = j;
        sectionTitle = line.replace(/^#{1,6}\s+/, '').trim();
        break;
      }
      
      // 匹配数字编号格式
      if (/^\d+(\.\d+)*\s+.+/.test(line) && !line.includes('图') && !line.includes('表')) {
        sectionLineIndex = j;
        sectionTitle = line.trim();
        break;
      }
      
      // 如果已经向上查找了20行还没找到小节标题，停止查找
      if (imageLineIndex - j > 20) {
        break;
      }
    }
    
    // 如果没有找到明确的小节标题，使用当前章节标题
    if (sectionTitle === '' && selectedBook.value) {
      const currentSection = selectedBook.value.chapters[selectedChapter.value].sections[selectedSection.value];
      sectionTitle = currentSection.title;
    }
    
    // 设置上下文范围
    let contextStart, contextEnd;
    if (sectionLineIndex !== -1) {
      // 如果找到了小节标题，从标题开始显示
      contextStart = sectionLineIndex;
      // 确保上下文包含图片行
      contextEnd = Math.min(lines.length - 1, imageLineIndex + 3);
    } else {
      // 如果没找到小节标题，就只显示图片周围的内容
      contextStart = Math.max(0, imageLineIndex - 3);
      contextEnd = Math.min(lines.length - 1, imageLineIndex + 3);
    }
    
    // 提取上下文并高亮图片标题所在句子
    const contextLines = lines.slice(contextStart, contextEnd + 1);
    const highlightedContext = highlightFigureSentences(contextLines.join('\n'), figureNumber);
    
    return {
      sectionTitle,
      contextText: highlightedContext
    };
  };
  
  // 简单返回文本，不进行高亮处理
  const highlightFigureSentences = (text: string, figureNumber: string): string => {
    return text;
  };
  
  // 监听tab切换，点击图目录时请求图片
  watch(catalogTab, async (tab) => {
    if (tab === 'figure' && hasSelectedSection.value && selectedBook.value) {
      const section = selectedBook.value.chapters[selectedChapter.value].sections[selectedSection.value];
      const match = section.title.match(/^(\d+(?:\.\d+)*)(\s|$)/);
      const chapterNo = match ? match[1] : '';
      if (chapterNo) {
        // 获取书籍ID
        const bookId = props.book ? (typeof props.book.id === 'string' ? parseInt(props.book.id) : props.book.id) : 1;
        
        imagesLoading.value = true;
        try {
          console.log(`请求章节 ${chapterNo} 的图片列表（书籍ID: ${bookId}）...`);
          const res = await axios.get(`http://localhost:8080/api/files/chapter/${chapterNo}/images?bookId=${bookId}`);
          const data = res.data as any;
          console.log('图片列表响应:', data);
          
          if (data && data.images && Array.isArray(data.images)) {
            sectionImages.value = data.images;
            console.log(`成功获取 ${data.images.length} 张图片`);
          } else {
            console.warn('响应中没有找到images数组');
            sectionImages.value = [];
          }
        } catch (e) {
          console.error('获取图片列表失败:', e);
          sectionImages.value = [];
        } finally {
          imagesLoading.value = false;
        }
      } else {
        console.warn('无法从章节标题提取章节号');
        sectionImages.value = [];
      }
    } else {
      sectionImages.value = [];
    }
  });
  
  // 切换章节时，获取图片列表
  watch([selectedChapter, selectedSection], async ([chapterIdx, sectionIdx]) => {
    if (chapterIdx >= 0 && sectionIdx >= 0 && selectedBook.value) {
      const section = selectedBook.value.chapters[chapterIdx].sections[sectionIdx];
      // 尝试从section.title中提取章节号
      const match = section.title.match(/^(\d+(?:\.\d+)*)(\s|$)/);
      const chapterNo = match ? match[1] : '';
      if (chapterNo) {
        // 获取书籍ID
        const bookId = props.book ? (typeof props.book.id === 'string' ? parseInt(props.book.id) : props.book.id) : 1;
        
        try {
          console.log(`章节切换，请求章节 ${chapterNo} 的图片列表（书籍ID: ${bookId}）...`);
          const res = await axios.get(`http://localhost:8080/api/files/chapter/${chapterNo}/images?bookId=${bookId}`);
          const data = res.data as any;
          console.log('章节切换图片列表响应:', data);
          
          if (data && data.images && Array.isArray(data.images)) {
            sectionImages.value = data.images;
            console.log(`章节切换成功获取 ${data.images.length} 张图片`);
          } else {
            console.warn('章节切换响应中没有找到images数组');
            sectionImages.value = [];
          }
        } catch (e) {
          console.error('章节切换获取图片列表失败:', e);
          sectionImages.value = [];
        }
      } else {
        console.warn('章节切换无法从章节标题提取章节号');
        sectionImages.value = [];
      }
    } else {
      sectionImages.value = [];
    }
  });
  
  // 定义句子类型
  interface SentenceItem {
    text: string;
    isTarget: boolean;
  }
  
  // processedSentences 明确类型
  const currentFigureNumber = computed(() => extractFigureNumber(selectedFigureTitle.value) || '');
  const processedSentences = computed<SentenceItem[]>(() => {
    if (!originalContent.value) return [];
    const raw = originalContent.value.split(/([。！？\n])/);
    const result: SentenceItem[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const s = raw[i] + (raw[i + 1] || '');
      result.push({
        text: s,
        isTarget: !!currentFigureNumber.value && s.includes('图' + currentFigureNumber.value),
      });
    }
    return result;
  });
 
  const targetSentences = computed(() =>
    processedSentences.value
      .map((s, idx) => ({ ...s, idx }))
      .filter(s => s.isTarget)
  );
  
  function scrollToOriginal(idx: number) {
    const el = document.getElementById(`sentence-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('active-highlight');
      setTimeout(() => el.classList.remove('active-highlight'), 2000);
    }
  }
  
  // 1. 定义高亮句子集合，初始为自动高亮
  const highlightedSentences = ref<number[]>([]); // 存储高亮句子的下标
  
  // 2. 自动高亮逻辑：每次点击图片时，重置高亮集合
  watch([selectedFigureTitle, processedSentences], () => {
    highlightedSentences.value = processedSentences.value
      .map((s, idx) => s.isTarget ? idx : -1)
      .filter(idx => idx !== -1);
  });
  
  // 3. 右栏高亮句子区域，添加取消高亮按钮
  // 找到右栏高亮句子渲染处，替换为：
  // <div v-for="idx in highlightedSentences" :key="idx" class="highlighted-sentence-editable">
  //   <span>{{ processedSentences[idx].text }}</span>
  //   <button @click="removeHighlight(idx)" class="remove-highlight-btn">取消高亮</button>
  // </div>
  
  // 4. 中间栏同步展示高亮句子
  // <span v-for="idx in highlightedSentences" :key="idx" class="highlighted-sentence clickable" @click="scrollToOriginal(idx)">{{ processedSentences[idx].text }}</span>
  
  // 5. 添加移除高亮的方法
  function removeHighlight(idx: number) {
    highlightedSentences.value = highlightedSentences.value.filter(i => i !== idx);
  }
  
  function addHighlight(idx: number) {
    if (!highlightedSentences.value.includes(idx)) {
      highlightedSentences.value.push(idx);
      highlightedSentences.value.sort((a, b) => a - b); // 保持顺序
    }
  }
  
  </script>
  
  <style scoped>
  .book-viewer-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f3f6fa;
  }
  .book-viewer-header {
    flex: none;
    padding: 36px 64px 28px 64px;
    background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
    color: #fff;
    display: flex;
    align-items: center;
    gap: 64px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  }
  .book-cover-img {
    width: 240px;
    height: 320px;
    object-fit: cover;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
    background: #fff;
  }
  .book-details {
    flex: 1;
    padding-left: 56px;
  }
  .book-title {
    font-size: 2.4em;
    font-weight: bold;
    margin-bottom: 8px;
  }
  .book-author {
    font-size: 1.2em;
    margin-bottom: 6px;
  }
  .book-description {
    font-size: 1.1em;
    color: #e0f7fa;
  }
  .header-actions {
    display: flex;
    gap: 18px;
  }
  .action-btn {
    background-color: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: white;
    font-size: 16px;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.3s ease;
  }
  .action-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  .close-btn {
    background-color: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: white;
    font-size: 16px;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.3s ease;
  }
  .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  .book-viewer-bottom {
    flex: 1;
    min-height: 0;
    display: flex;
    height: calc(100vh - 180px);
    background: #f3f6fa;
  }
  
  .catalog-area {
    flex: 0 0 30%;
    min-width: 320px;
    max-width: 450px;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #f6f8fa;
    border-right: 1.5px solid #e5e7eb;
    box-shadow: 2px 0 8px rgba(0,0,0,0.03);
    border-radius: 16px 0 0 16px;
    margin-right: 0;
  }
  .catalog-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 20px 16px 20px;
    scrollbar-width: thin;
    scrollbar-color: #b2ebf2 #f6f8fa;
  }
  .catalog-content::-webkit-scrollbar {
    width: 8px;
  }
  .catalog-content::-webkit-scrollbar-track {
    background: #f6f8fa;
    border-radius: 4px;
  }
  .catalog-content::-webkit-scrollbar-thumb {
    background: #b2ebf2;
    border-radius: 4px;
    transition: background 0.3s;
  }
  .catalog-content::-webkit-scrollbar-thumb:hover {
    background: #80deea;
  }
  
  /* 目录标签样式 */
  .catalog-tabs {
    display: flex;
    gap: 8px;
    padding: 16px 16px 12px 16px;
    background: #f6f8fa;
    border-bottom: 2px solid #e5e7eb;
  }
  .catalog-tabs button {
    flex: 1;
    padding: 10px 16px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  .catalog-tabs button:hover {
    background: #f0f9ff;
    color: #1890ff;
    border-color: #b2ebf2;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  }
  .catalog-tabs button.active {
    background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
    color: #fff;
    border-color: #00a3ff;
    box-shadow: 0 4px 12px rgba(0, 163, 255, 0.3);
    font-weight: 600;
  }
  
  .center-area {
    flex: 0 0 35%;
    min-width: 350px;
    max-width: 650px;
    background: #fff;
    border-right: 1.5px solid #e5e7eb;
    border-left: 1.5px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 32px 20px;
    box-shadow: 0 0 8px rgba(0,0,0,0.04);
    border-radius: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }
  .figure-preview-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0;
    overflow: hidden;
  }
  .figure-img-wrapper {
    background: #f8fafc;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    padding: 18px 18px 12px 18px;
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 90%;
  }
  .figure-img {
    max-width: 600px;
    max-height: 45vh;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    background: #fff;
    border: 1.5px solid #e5e7eb;
  }
  .figure-context-card {
    background: #f6f8fa;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    padding: 18px 22px 14px 22px;
    margin-top: 0;
    max-width: 700px;
    width: 100%;
    font-size: 1.08em;
    color: #333;
    word-break: break-all;
    flex: 1 1 auto;
    overflow-y: auto;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: #b2ebf2 #f6f8fa;
  }
  .context-section-title {
    display: block;
    font-weight: bold;
    color: #1890ff;
    font-size: 1.1em;
    margin-bottom: 8px;
  }
  .context-text {
    background: none;
    border: none;
    font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
    font-size: 1em;
    color: #444;
    margin: 0;
    padding: 0;
    white-space: pre-line;
    line-height: 1.6;
  }
  
  .highlighted-sentence {
    background-color: #fff3cd;
    border-left: 3px solid #ffc107;
    padding: 8px 12px;
    margin: 8px 0;
    border-radius: 4px;
    font-weight: 500;
    color: #856404;
    display: block;
  }
  .right-area {
    flex: 1;
    min-width: 400px;
    padding: 28px 32px 28px 28px;
    background: #f6f8fa;
    overflow-y: auto;
    border-radius: 0 16px 16px 0;
    height: 100%;
  }
  .right-area::-webkit-scrollbar {
    width: 10px;
  }
  .right-area::-webkit-scrollbar-track {
    background: #f6f8fa;
    border-radius: 5px;
  }
  .right-area::-webkit-scrollbar-thumb {
    background: #b2ebf2;
    border-radius: 5px;
    transition: background 0.3s;
  }
  .right-area::-webkit-scrollbar-thumb:hover {
    background: #80deea;
  }
  .book-detail-section {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    padding: 40px 48px 40px 48px;
    min-height: calc(100vh - 250px);
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .book-detail-section::-webkit-scrollbar {
    width: 10px;
  }
  .book-detail-section::-webkit-scrollbar-track {
    background: #f9f9f9;
    border-radius: 5px;
  }
  .book-detail-section::-webkit-scrollbar-thumb {
    background: #b2ebf2;
    border-radius: 5px;
    transition: background 0.3s;
  }
  .book-detail-section::-webkit-scrollbar-thumb:hover {
    background: #80deea;
  }
  .book-viewer-content {
    flex: 1;
    padding: 25px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
  .book-info-section {
    display: flex;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 0;
  }
  .book-cover-wrapper {
    flex: 0 0 300px;
    background-color: #e8eaed;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    height: 400px; /* 添加固定高度 */
    overflow: hidden; /* 防止图片溢出 */
  }
  .book-cover-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); /* 添加阴影效果 */
  }
  .book-details {
    flex: 1;
    padding: 30px;
  }
  .book-title {
    margin: 0 0 10px 0;
    font-size: 28px;
    font-weight: 700;
    color: #333;
  }
  .book-subtitle {
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #666;
    font-weight: 500;
  }
  .book-author {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: #444;
  }
  .book-description {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: #555;
  }
  .book-content-section {
    flex: 1;
    min-height: 500px;
  }
  .toc-container {
    display: flex;
    gap: 25px;
    height: 100%;
  }
  .book-toc-section {
    flex: 1;
    background-color: transparent;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    overflow-y: visible;
    max-height: none;
    height: 100%;
  }
  .book-detail-section {
    flex: 0 0 65%;
    background-color: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    overflow-y: auto;
    max-height: 600px;
  }
  .book-toc-section h4, .book-detail-section h4 {
    margin-top: 0;
    margin-bottom: 24px;
    font-size: 22px;
    font-weight: 600;
    color: #0277bd;
    border-bottom: 2px solid #e0f7fa;
    padding-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .book-toc ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .book-toc li {
    margin-bottom: 10px;
  }
  .chapter-title {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 16px;
    background-color: #f5f5f5;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    line-height: 1.6;
    gap: 12px;
  }
  .chapter-title:hover {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 163, 255, 0.15);
  }
  .chapter-title.active {
    background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
    color: #0277bd;
    border-left: 4px solid #00a3ff;
    box-shadow: 0 2px 8px rgba(0, 163, 255, 0.2);
    font-weight: 600;
  }
  .chapter-sections {
    padding-left: 25px !important;
    margin-top: 10px !important;
  }
  .chapter-sections li {
    padding: 10px 16px;
    border-left: 2px solid #ddd;
    margin-bottom: 6px;
    transition: all 0.3s ease;
    cursor: pointer;
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    line-height: 1.5;
  }
  .chapter-sections li:hover {
    border-left: 3px solid #00a3ff;
    background: linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%);
    transform: translateX(4px);
    box-shadow: 0 2px 6px rgba(0, 163, 255, 0.1);
    padding-left: 15px;
  }
  .chapter-sections li.active {
    border-left: 3px solid #00a3ff;
    background: linear-gradient(90deg, #e0f7fa 0%, #f0f9ff 100%);
    color: #0277bd;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(0, 163, 255, 0.15);
    padding-left: 15px;
  }
  .toggle-icon {
    font-size: 12px;
  }
  .section-detail {
    padding: 10px;
  }
  .section-title {
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
    margin-top: 0;
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e0f7fa;
    line-height: 1.4;
  }
  .section-content {
    font-size: 17px;
    line-height: 2;
    color: #333;
    margin-bottom: 30px;
    letter-spacing: 0.3px;
  }
  .section-content p {
    margin-bottom: 24px;
    text-align: justify;
  }
  .section-content strong {
    color: #1a1a1a;
    font-size: 19px;
    font-weight: 600;
    display: inline-block;
    margin-bottom: 12px;
  }
  /* 优化章节内容中的各种元素 */
  .section-content h1 {
    font-size: 26px;
    font-weight: 600;
    color: #1a1a1a;
    margin-top: 32px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e0f7fa;
  }
  .section-content h2 {
    font-size: 23px;
    font-weight: 600;
    color: #1a1a1a;
    margin-top: 28px;
    margin-bottom: 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
  }
  .section-content h3 {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-top: 24px;
    margin-bottom: 16px;
  }
  .section-content h4 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-top: 20px;
    margin-bottom: 14px;
  }
  .section-content ul, .section-content ol {
    margin: 20px 0;
    padding-left: 32px;
    line-height: 2;
  }
  .section-content li {
    margin-bottom: 12px;
    color: #333;
  }
  .section-content code {
    background: #f5f5f5;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 15px;
    color: #e83e8c;
    border: 1px solid #e8e8e8;
  }
  .section-content pre {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 24px 0;
    border: 1px solid #e8e8e8;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .section-content pre code {
    background: none;
    padding: 0;
    .catalog-area, .center-area, .right-area { height: auto; }
    .center-area, .right-area { padding: 16px 6px; }
  }
  @media (max-width: 768px) {
    .book-viewer-header {
      padding: 12px 20px;
    }
    .book-viewer-content {
      padding: 15px;
    }
    .book-details {
      padding: 20px;
    }
    .book-title {
      font-size: 24px;
    }
    .book-toc-section, .book-detail-section {
      padding: 15px;
    }
  }
  .loading-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    color: #666;
  }
  .error-message {
    padding: 15px;
    background-color: #fff1f0;
    border: 1px solid #ffccc7;
    border-radius: 6px;
    color: #cf1322;
    margin-bottom: 15px;
  }
  .section-toc {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 6px;
    border-left: 3px solid #00a3ff;
  }
  .section-toc h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    font-size: 18px;
  }
  .section-toc ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .section-toc li {
    margin-bottom: 8px;
    font-size: 14px;
    color: #444;
    transition: all 0.2s ease;
  }
  .section-toc li:hover {
    color: #00a3ff;
  }
  .toc-prefix {
    font-weight: 600;
    margin-right: 8px;
    color: #666;
  }
  .toc-title {
    font-weight: 500;
  }
  /* 添加调试信息区域的样式 */
  .debug-info {
    margin-top: 20px;
    background-color: #fff1f0;
    border: 1px solid #ffccc7;
    border-radius: 8px;
    overflow: hidden;
  }
  .debug-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #fff2f0;
    border-bottom: 1px solid #ffccc7;
  }
  .debug-header h4 {
    margin: 0;
    color: #cf1322;
    font-size: 16px;
  }
  .debug-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 16px;
  }
  .debug-content {
    padding: 15px;
  }
  .debug-btn {
    margin-top: 10px;
    padding: 8px 16px;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .debug-btn:hover {
    background-color: #40a9ff;
  }
  /* 添加子目录样式 */
  .section-subsections {
    padding-left: 15px !important;
    margin-top: 10px !important;
    border-left: none !important;
  }
  .section-subsections li {
    padding: 6px 10px;
    border-left: 1px solid #eee;
    margin-bottom: 4px;
    font-size: 13px;
    cursor: pointer;
  }
  .section-subsections li:hover {
    background-color: #f5f5f9;
    border-left: none;
  }
  .section-subsections .level-1 {
    padding-left: 10px;
  }
  .section-subsections .level-2 {
    padding-left: 20px;
  }
  .section-subsections .level-3 {
    padding-left: 30px;
  }
  .section-subsections .level-4 {
    padding-left: 40px;
  }
  /* 小节标题样式 */
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
  .subsection-title {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    gap: 8px;
  }
  .subsection-title-content {
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
  .toggle-icon.small {
    font-size: 10px;
    color: #999;
  }
  .has-children {
    position: relative;
  }
  .has-children:hover > .subsection-title .toggle-icon.small {
    color: #00a3ff;
  }
  /* 子目录的子目录样式 */
  .subsection-children {
    margin-top: 5px !important;
    padding-left: 15px !important;
    border-left: 1px dashed #eee !important;
  }
  .subsection-children li {
    padding: 4px 8px;
    margin-bottom: 3px;
    font-size: 12px;
    border-left: none;
  }
  .subsection-children li:hover {
    background-color: #f5f5f9;
    border-left: none;
  }
  /* 添加摘要按钮样式 */
  .summary-btn {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    opacity: 0.6;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .summary-btn:hover {
    color: #00a3ff;
    background-color: rgba(0, 163, 255, 0.1);
    opacity: 1;
  }
  .summary-btn.small {
    font-size: 12px;
    padding: 2px;
  }
  /* 添加摘要内容样式 */
  .summary-content {
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    border-left: 3px solid #00a3ff;
    margin-bottom: 20px;
  }
  .summary-text {
    font-size: 16px;
    line-height: 1.8;
    color: #444;
    white-space: pre-line; /* 保留换行符 */
  }
  /* 添加关闭摘要按钮样式 */
  .close-summary-btn {
    background-color: rgba(0, 0, 0, 0.1);
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    margin-left: 10px;
  }
  .close-summary-btn:hover {
    background-color: rgba(0, 0, 0, 0.2);
    color: #333;
  }
  /* 添加重试按钮样式 */
  .retry-btn {
    margin-top: 10px;
    padding: 6px 12px;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .retry-btn:hover {
    background-color: #40a9ff;
  }
  /* 添加摘要注释样式 */
  .summary-note {
    margin-top: 15px;
    padding: 10px;
    background-color: #fffbe6;
    border-radius: 4px;
    border-left: 3px solid #faad14;
    font-size: 14px;
    color: #876800;
  }
  .summary-note p {
    margin: 0;
  }
  /* 修改标题样式，使其能够容纳关闭按钮 */
  .book-detail-section h4 {
    display: flex;
    align-items: center;
  }
  .toc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
    border-radius: 8px;
    border-bottom: 2px solid #00a3ff;
    box-shadow: 0 2px 8px rgba(0, 163, 255, 0.1);
  }
  .toc-header h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #0277bd;
  }
  .toc-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .export-toc-btn, .detailed-toc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 3px 8px rgba(24, 144, 255, 0.35);
    min-width: 130px;
    height: 40px;
  }
  .export-toc-btn .btn-icon, .detailed-toc-btn .btn-icon {
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .export-toc-btn .btn-text, .detailed-toc-btn .btn-text {
    font-size: 14px;
    line-height: 1;
    white-space: nowrap;
  }
  .export-toc-btn:hover, .detailed-toc-btn:hover {
    background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(24, 144, 255, 0.45);
  }
  .export-toc-btn:active, .detailed-toc-btn:active {
    background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
  }
  /* 添加显示原文按钮样式 */
  .show-original-btn {
    margin-left: 15px;
    padding: 6px 12px;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .show-original-btn:hover {
    background-color: #40a9ff;
  }
  /* 原文内容样式 */
  .original-content {
    margin-bottom: 30px;
    background-color: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #eee;
    overflow: hidden;
  }
  .original-content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #f0f0f0;
    border-bottom: 1px solid #eee;
  }
  .original-content-header h4 {
    margin: 0;
    font-size: 16px;
    color: #333;
  }
  .close-original-btn {
    background-color: rgba(0, 0, 0, 0.1);
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  .close-original-btn:hover {
    background-color: rgba(0, 0, 0, 0.2);
    color: #333;
  }
  .original-markdown {
    padding: 16px;
    max-height: 500px;
    overflow-y: auto;
  }
  .original-markdown pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .original-markdown code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
  }
  /* 添加图片预览相关样式 */
  .image-preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .image-preview-container {
    background-color: white;
    border-radius: 8px;
    width: 90%; /* 增加宽度从80%到90% */
    max-width: 1200px; /* 增加最大宽度从1000px到1200px */
    max-height: 95vh; /* 增加最大高度从90vh到95vh */
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .image-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px; /* 增加内边距 */
    background-color: #f0f0f0;
    border-bottom: 1px solid #eee;
  }
  .image-preview-header h4 {
    margin: 0;
    font-size: 20px; /* 增加字体大小 */
    color: #333;
  }
  .close-preview-btn {
    background-color: rgba(0, 0, 0, 0.1);
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 16px; /* 增加字体大小 */
    padding: 6px 12px; /* 增加按钮大小 */
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  .close-preview-btn:hover {
    background-color: rgba(0, 0, 0, 0.2);
    color: #333;
  }
  .image-preview-content {
    padding: 20px;
    overflow: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    max-height: 65vh; /* 增加图片区域高度 */
    min-height: 300px; /* 添加最小高度 */
  }
  .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
  }
  .image-preview-context {
    padding: 20px; /* 增加内边距 */
    background-color: #f9f9f9;
    border-top: 1px solid #eee;
    max-height: 30vh; /* 增加上下文区域高度 */
    min-height: 150px; /* 添加最小高度 */
    overflow-y: auto;
  }
  .image-preview-context h5 {
    margin-top: 0;
    margin-bottom: 15px; /* 增加下边距 */
    font-size: 18px; /* 增加字体大小 */
    color: #333;
    border-bottom: 1px dashed #ddd; /* 添加下划线 */
    padding-bottom: 8px; /* 添加下内边距 */
  }
  .context-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .section-info {
    background-color: #e6f7ff;
    border-left: 4px solid #1890ff;
    padding: 10px 15px;
    border-radius: 4px;
    font-weight: 500;
    color: #0050b3;
    font-size: 16px;
  }
  .context-text {
    margin: 0;
    padding: 12px;
    background-color: #fff;
    border: 1px solid #eee;
    border-radius: 4px;
    white-space: pre-wrap;
    font-family: 'Courier New', Courier, monospace;
    font-size: 15px;
    line-height: 1.6;
    color: #444;
    overflow-x: auto;
  }
  .image-preview-context p {
    margin: 0;
    white-space: pre-line;
    font-family: 'Courier New', Courier, monospace;
    font-size: 15px; /* 增加字体大小 */
    line-height: 1.6; /* 增加行高 */
    color: #444; /* 调整颜色 */
  }
  /* 图表列表样式 */
  .image-section {
    margin-bottom: 15px;
    border-left: 2px solid #1890ff !important;
  }
  .image-section-title {
    padding: 8px 12px;
    background-color: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .image-section-title:hover {
    background-color: #bae7ff;
  }
  .image-list {
    padding-left: 15px !important;
    margin-top: 5px !important;
  }
  .image-item {
    padding: 6px 12px !important;
    margin-bottom: 4px !important;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-left: none !important;
    background-color: #f5f5f5;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  .image-item:hover {
    background-color: #e6f7ff;
    color: #1890ff;
  }
  .image-icon {
    margin-right: 8px;
    font-size: 16px;
  }
  .image-title {
    font-size: 13px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* 原文中可点击图片链接样式 */
  :deep(.clickable-image) {
    display: inline-block;
    padding: 2px 4px;
    background-color: #e6f7ff;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid #91d5ff;
  }
  :deep(.clickable-image:hover) {
    background-color: #bae7ff;
    border-color: #1890ff;
  }
  /* 添加图片加载和错误状态样式 */
  .image-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 200px;
    color: #666;
    font-size: 16px;
  }
  .image-error {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 30px;
    text-align: center;
  }
  .image-error p {
    color: #f5222d;
    font-size: 16px;
    margin-bottom: 15px;
  }
  .image-debug-info {
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 4px;
    padding: 15px;
    margin-top: 10px;
    width: 100%;
    max-width: 600px;
    text-align: left;
  }
  .image-debug-info p {
    color: #666;
    font-size: 14px;
    margin-bottom: 10px;
    word-break: break-all;
  }
  .retry-btn, .copy-url-btn {
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    margin: 5px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .retry-btn:hover, .copy-url-btn:hover {
    background-color: #40a9ff;
  }
  /* 超细化目录样式 */
  .toc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #eee;
  }
  .toc-actions {
    display: flex;
    gap: 8px;
  }
  .detailed-toc-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .detailed-toc-btn:hover {
    background-color: #40a9ff;
  }
  .detailed-toc-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .detailed-toc-container {
    background-color: white;
    border-radius: 8px;
    width: 80%;
    height: 80%;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  .detailed-toc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .detailed-toc-content {
    flex: 1;
    overflow-y: auto;
  }
  .detailed-toc-list {
    list-style: none;
    padding: 0;
  }
  .chapter-title, .section-title, .detailed-item-title, .sub-item-title {
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chapter-title:hover, .section-title:hover, .detailed-item-title:hover {
    background-color: #f5f5f5;
  }
  .toggle-icon {
    font-size: 12px;
    width: 20px;
    text-align: center;
  }
  .chapter-sections {
    margin-left: 20px;
  }
  .detailed-items {
    margin-left: 40px;
  }
  .sub-items {
    margin-left: 20px;
  }
  .item-prefix {
    color: #666;
    margin-right: 8px;
  }
  .numbered .item-prefix {
    color: #0066cc;
  }
  .lettered .item-prefix {
    color: #009688;
  }
  .level-1 { margin-left: 0; }
  .level-2 { margin-left: 20px; }
  .level-3 { margin-left: 40px; }
  .level-4 { margin-left: 60px; }
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  .progress-bar {
    width: 100%;
    height: 4px;
    background-color: #eee;
    border-radius: 2px;
    margin-top: 10px;
  }
  .progress {
    height: 100%;
    background-color: #4CAF50;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  .toc-info {
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 4px;
  }
  .export-btn, .close-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 10px;
  }
  .export-btn {
    background-color: #4CAF50;
    color: white;
  }
  .close-btn {
    background-color: #f44336;
    color: white;
  }
  .error-message {
    color: #f44336;
    padding: 20px;
    text-align: center;
  }
  /* 添加图表标题样式 */
  .figure-item, .table-item {
    font-style: italic;
    color: #666;
    background-color: #f9f9f9;
    border-left: 3px solid;
    padding-left: 12px;
    margin-top: 5px;
    margin-bottom: 5px;
  }
  .figure-item {
    border-left-color: #1890ff;
  }
  .table-item {
    border-left-color: #52c41a;
  }
  .item-type-icon {
    margin-right: 5px;
    display: inline-block;
    width: 20px;
    text-align: center;
  }
  /* 调整目录项的悬停效果 */
  .figure-item:hover, .table-item:hover {
    background-color: #f0f9ff;
  }
  /* 图表标题的文字截断处理 */
  .figure-title .item-title, .table-title .item-title {
    max-width: 450px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
  }
  /* 添加新的样式 */
  .sub-item {
    margin-left: 15px;
    border-left: 1px dashed #ddd;
    padding-left: 10px;
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .extracted-item {
    color: #555;
    font-size: 0.95em;
    font-style: italic;
    background-color: #f8f8f8;
    padding: 4px 8px;
    border-radius: 4px;
    margin-top: 3px;
    margin-bottom: 3px;
  }
  .item-number, .item-letter {
    color: #1890ff;
    font-weight: 500;
    margin-right: 6px;
  }
  .special-title {
    border-radius: 4px;
    margin-top: 8px;
    margin-bottom: 8px;
  }
  /* 美化目录层次结构 */
  .detailed-items {
    border-left: 1px solid #e8e8e8;
    padding-left: 15px;
  }
  .detailed-items .detailed-items {
    margin-left: 20px;
  }
  /* 提取的子项特殊样式 */
  .extracted-item .item-title {
    color: #666;
    font-size: 0.9em;
  }
  /* 添加提示样式 */
  .item-title[title]:hover::after {
    content: attr(title);
    position: absolute;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    max-width: 300px;
    z-index: 10;
    white-space: normal;
    margin-top: 24px;
    left: 20px;
  }
  /* 调整提取的子项样式 */
  .extracted-item {
    color: #555;
    font-size: 0.95em;
    background-color: #f0f8ff; /* 使用浅蓝色背景 */
    padding: 5px 8px;
    border-radius: 4px;
    margin-top: 4px;
    margin-bottom: 4px;
    border-left: 2px solid #1890ff;
  }
  /* 优化子项样式 */
  .sub-items {
    margin-left: 20px;
    padding-left: 10px;
    border-left: 1px dashed #ddd;
  }
  .sub-item {
    margin-top: 6px;
    margin-bottom: 6px;
    position: relative;
  }
  .sub-item:before {
    content: '';
    position: absolute;
    width: 5px;
    height: 5px;
    background-color: #ddd;
    border-radius: 50%;
    left: -15px;
    top: 50%;
    transform: translateY(-50%);
  }
  /* 使提取的项更加突出 */
  .sub-item.extracted-item:before {
    background-color: #1890ff;
  }
  /* 指示有更多详细内容的样式 */
  .item-has-details {
    color: #1890ff;
    font-weight: bold;
    margin-left: 5px;
    cursor: pointer;
  }
  /* 嵌套子项的样式 */
  .nested-sub-items {
    margin-left: 15px;
    padding-left: 10px;
    border-left: 1px dotted #ccc;
    margin-top: 3px;
  }
  .nested-item {
    margin-top: 3px;
    margin-bottom: 3px;
    font-size: 0.9em;
    position: relative;
  }
  .nested-item:before {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    background-color: #aaa;
    border-radius: 50%;
    left: -12px;
    top: 50%;
    transform: translateY(-50%);
  }
  .nested-item-title {
    padding: 3px 0;
    color: #666;
  }
  /* 强化视觉层次 */
  .level-1 > .detailed-item-title { font-weight: bold; color: #111; }
  .level-2 > .detailed-item-title { font-weight: 500; color: #333; }
  .level-3 > .detailed-item-title { font-weight: normal; color: #555; }
  .level-4 > .detailed-item-title { font-weight: normal; color: #666; }
  /* 优化子项容器 */
  .sub-items {
    background-color: #fafafa;
    border-radius: 4px;
    padding: 5px 10px 5px 20px;
    margin-top: 5px;
    margin-bottom: 5px;
  }
  .center-placeholder {
    color: #b0b6c3;
    text-align: center;
    width: 100%;
    height: 100%;
    font-size: 1.2em;
    padding: 40px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 250px);
  }
  
  /* 图目录相关样式 */
  .no-images-message {
    text-align: center;
    color: #999;
    padding: 20px;
    font-style: italic;
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
  
  /* 优化图目录项的样式 */
  .catalog-content ul li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 8px;
    transition: all 0.3s ease;
    margin-bottom: 6px;
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    line-height: 1.6;
  }
  
  .catalog-content ul li:hover {
    background-color: #f0faff;
    transform: translateX(2px);
  }
  
  .catalog-content ul li.active {
    background-color: #e6f7ff;
    border-left: 3px solid #1890ff;
    padding-left: 9px;
  }
  
  .active-highlight {
    background-color: #ffecb3 !important;
    border-left: 5px solid #ff9800 !important;
    color: #d84315 !important;
    box-shadow: 0 0 8px #ff9800;
    transition: all 0.3s;
  }
  .remove-highlight-btn {
    margin-left: 8px;
    color: #f56c6c;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
  }
  .highlighted-sentence-editable {
    background: #fffbe6;
    border-radius: 4px;
    padding: 2px 6px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
  }
  .sentence-clickable {
    cursor: pointer;
    transition: background 0.2s;
  }
  .sentence-clickable:hover {
    background: #e6f7ff;
    border-radius: 4px;
  }
  
  /* 引用跳转闪烁效果 */
  .citation-flash {
    animation: citation-highlight 2s ease-in-out;
  }
  
  @keyframes citation-highlight {
    0%, 100% {
      background: #fffbe6;
    }
    25% {
      background: #fff566;
      box-shadow: 0 0 10px rgba(255, 213, 0, 0.5);
    }
    50% {
      background: #fffbe6;
    }
    75% {
      background: #fff566;
      box-shadow: 0 0 10px rgba(255, 213, 0, 0.5);
    }
  }
  
  /* 引文目录相关样式 */
  .no-citations-message {
    text-align: center;
    color: #999;
    padding: 20px;
    font-style: italic;
  }
  
  .citation-icon {
    margin-right: 8px;
    font-size: 14px;
  }
  
  .citation-text {
    font-size: 13px;
    line-height: 1.4;
    word-break: break-word;
  }
  
  .citation-preview-panel {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }
  
  .citation-content-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .citation-text-display {
    font-size: 16px;
    line-height: 1.8;
    color: #333;
    padding: 15px;
    background: #f9f9f9;
    border-left: 4px solid #1890ff;
    border-radius: 4px;
    margin-bottom: 20px;
  }
  
  .citation-context {
    margin-top: 20px;
  }
  
  .citation-context h5 {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
  }
  
  .citation-context p {
    font-size: 14px;
    line-height: 1.6;
    color: #555;
    padding: 10px;
    background: #fafafa;
    border-radius: 4px;
    white-space: pre-wrap;
  }
  </style> 