<template>
    <div class="book-list-container">
      <div class="book-list-header">
        <h2>地质科学书籍馆</h2>
        <button class="back-btn" @click="goBack">返回地图</button>
      </div>
      
      <div class="book-list-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在加载书籍列表...</p>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="books.length === 0 && relatedBooks.length === 0" class="empty-state">
          <span class="empty-icon">📚</span>
          <p>暂无书籍</p>
          <p class="empty-hint">请在文件管理中心上传书籍文件</p>
        </div>
        
        <!-- 书籍内容 -->
        <template v-else>
          <!-- 主要书籍 -->
          <div v-if="books.length > 0" class="featured-book">
            <div class="featured-book-card" @click="openBookDetails(books[0])">
              <div class="featured-book-cover">
                <img :src="books[0].coverUrl" :alt="books[0].title" @error="handleImageError" />
              </div>
              <div class="featured-book-info">
                <h3 class="featured-book-title">{{ books[0].title }}</h3>
                <p class="featured-book-subtitle">{{ books[0].description || '地质科学书籍' }}</p>
                <p class="featured-book-author">作者: {{ books[0].author }}</p>
                <p class="featured-book-publisher">地质科学书籍馆</p>
                <p class="featured-book-description">
                  {{ books[0].description || '本书详细阐述了地质科学相关内容，包含丰富的章节和详细的内容。' }}
                </p>
                <div class="featured-book-buttons">
                  <div class="featured-book-button" @click.stop="openBookDetails(books[0])">
                    查看详情
                  </div>
                  <div class="featured-book-button knowledge-graph-btn" @click.stop="buildKnowledgeGraph(books[0])">
                    知识图谱构建
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 相关推荐 -->
          <div v-if="relatedBooks.length > 0">
            <h3 class="section-title">相关推荐</h3>
            
            <div class="book-grid">
              <div 
                v-for="book in relatedBooks" 
                :key="book.id" 
                class="book-card"
                @click="openBookDetails(book)"
              >
                <div class="book-cover">
                  <img :src="book.coverUrl" :alt="book.title" @error="handleImageError" />
                </div>
                <div class="book-info">
                  <h3 class="book-title">{{ book.title }}</h3>
                  <p class="book-author">作者: {{ book.author }}</p>
                  <p class="book-description">{{ book.description || '暂无描述' }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
      
      <!-- 书籍详情弹窗 -->
      <div class="book-modal" v-if="showBookModal">
        <div class="modal-overlay" @click="closeBookModal"></div>
        <div class="modal-content fullscreen">
          <BookViewer 
            :book="selectedBook" 
            @close="closeBookModal" 
          />
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage } from 'element-plus';
  import BookViewer from '../components/BookViewer.vue';
  import { bookApi, type Book as ApiBook } from '../api/bookApi';
  
  // 定义书籍接口（用于 BookViewer）
  interface Section {
    title: string;
    pageNumber: number;
  }
  
  interface Chapter {
    title: string;
    sections: Section[];
    chapter: string;
  }
  
  interface Book {
    id: string;  // BookViewer 期望 string 类型
    title: string;
    author: string;
    coverUrl: string;
    description?: string;  // 描述信息
    chapters: Chapter[];  // chapters 是必需的，BookViewer 会在 fetchAllMarkdownFiles 中自动构建
  }
  
  const router = useRouter();
  
  // 加载状态
  const loading = ref(false);
  
  // 主要书籍和相关推荐书籍数据（从后端获取）
  const books = ref<Book[]>([]);
  const relatedBooks = ref<Book[]>([]);
  
  // 控制书籍详情弹窗
  const showBookModal = ref(false);
  const selectedBook = ref<Book | undefined>(undefined);
  
  // 从后端 API 获取书籍列表
  const loadBooks = async () => {
    loading.value = true;
    try {
      const response = await bookApi.getAllBooks();
      const apiBooks = response.books || [];
      
      // 转换为 Book 格式，添加默认封面
      const convertedBooks: Book[] = apiBooks.map((apiBook: ApiBook) => ({
        id: String(apiBook.id),  // 转换为字符串（BookViewer 需要）
        title: apiBook.title || apiBook.name,
        author: apiBook.author || '未知作者',
        coverUrl: getDefaultCoverUrl(apiBook.id),  // 使用默认封面
        description: apiBook.description || '',
        chapters: [],  // 初始为空数组，BookViewer 会在 fetchAllMarkdownFiles 中自动构建
      }));
      
      // 第一个书籍作为主要书籍
      if (convertedBooks.length > 0) {
        books.value = [convertedBooks[0]];
        // 其余书籍作为相关推荐
        relatedBooks.value = convertedBooks.slice(1);
      } else {
        // 如果没有书籍，显示空状态
        books.value = [];
        relatedBooks.value = [];
      }
      
      console.log('📚 书籍列表加载成功:', {
        总数: convertedBooks.length,
        主要书籍: books.value.length,
        相关推荐: relatedBooks.value.length
      });
    } catch (error: any) {
      console.error('❌ 加载书籍列表失败:', error);
      ElMessage.error(`加载书籍列表失败: ${error.message || '未知错误'}`);
      books.value = [];
      relatedBooks.value = [];
    } finally {
      loading.value = false;
    }
  };
  
  // 获取默认封面 URL（根据书籍 ID 或名称）
  const getDefaultCoverUrl = (bookId: number): string => {
    // 可以根据书籍 ID 或名称返回不同的默认封面
    // 这里使用一个通用的默认封面，或者可以根据 bookId 返回不同的图片
    const defaultCovers: Record<number, string> = {
      1: '/images/板块构造与地貌形迹.jpg',
      2: '/images/板块构造与地貌形迹下.jpg',
      3: '/images/亚洲地貌圈及其板块造貌构造纲要.jpg',
      4: '/images/地学新两论 上篇 板块造貌构造学-兼论板块学说新发展.jpg',
    };
    
    return defaultCovers[bookId] || '/images/default-book-cover.jpg';
  };
  
  // 打开书籍详情
  const openBookDetails = (book: Book) => {
    // book.id 已经是 string 类型，直接使用
    selectedBook.value = book;
    showBookModal.value = true;
  };
  
  // 关闭书籍详情
  const closeBookModal = () => {
    showBookModal.value = false;
  };
  
  // 返回地图页面
  const goBack = () => {
    router.push('/');
  };
  
  // 处理图片加载错误
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    // 使用默认封面
    img.src = '/images/default-book-cover.jpg';
  };
  
  // 构建知识图谱
  const buildKnowledgeGraph = (book: Book) => {
    console.log('构建知识图谱:', book.title);
    // 跳转到知识图谱页面
    router.push({
      path: '/knowledge-graph',
      query: {
        id: book.id,
        title: book.title
      }
    });
  };
  
  // 组件挂载时加载书籍列表
  onMounted(() => {
    loadBooks();
  });
  </script>
  
  <style scoped>
  .book-list-container {
    width: 100%;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 30px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  
  .book-list-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 40px;
    gap: 30px;
  }
  
  .book-list-header h2 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 1px;
    flex-grow: 1;
  }
  
  .back-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 163, 255, 0.2);
  }
  
  .back-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 163, 255, 0.3);
  }
  
  /* 特色书籍样式 */
  .featured-book {
    margin-bottom: 50px;
  }
  
  .featured-book-card {
    display: flex;
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: all 0.4s ease;
    cursor: pointer;
    min-height: 480px;
  }
  
  .featured-book-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }
  
  .featured-book-cover {
    flex: 0 0 30%;
    max-width: 30%;
    background-color: #e8eaed;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    padding: 15px;
    height: 480px; /* 添加固定高度 */
  }
  
  .featured-book-cover img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.6s ease;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); /* 添加阴影效果 */
  }
  
  .featured-book-card:hover .featured-book-cover img {
    transform: scale(1.05);
  }
  
  .featured-book-info {
    flex: 0 0 70%;
    max-width: 70%;
    padding: 35px;
    display: flex;
    flex-direction: column;
  }
  
  .featured-book-title {
    margin: 0 0 10px 0;
    font-size: 32px;
    font-weight: 700;
    color: #333;
  }
  
  .featured-book-subtitle {
    margin: 0 0 20px 0;
    font-size: 20px;
    color: #666;
    font-weight: 500;
  }
  
  .featured-book-author {
    margin: 0 0 5px 0;
    font-size: 18px;
    color: #444;
  }
  
  .featured-book-publisher {
    margin: 0 0 20px 0;
    font-size: 16px;
    color: #666;
  }
  
  .featured-book-description {
    margin: 0 0 30px 0;
    font-size: 16px;
    line-height: 1.6;
    color: #555;
    flex-grow: 1;
  }
  
  .featured-book-buttons {
    display: flex;
    gap: 15px;
    align-self: flex-start;
  }
  
  .featured-book-button {
    padding: 12px 25px;
    background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
    color: white;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 163, 255, 0.2);
    text-align: center;
    cursor: pointer;
  }
  
  .featured-book-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 163, 255, 0.3);
  }
  
  .featured-book-button.knowledge-graph-btn {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    box-shadow: 0 4px 10px rgba(255, 107, 107, 0.2);
  }
  
  .featured-book-button.knowledge-graph-btn:hover {
    box-shadow: 0 6px 15px rgba(255, 107, 107, 0.3);
  }
  
  /* 章节标题 */
  .section-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
    margin: 0 0 30px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #e0e0e0;
    position: relative;
  }
  
  .section-title::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 80px;
    height: 2px;
    background: linear-gradient(90deg, #00e5b0, #00a3ff);
  }
  
  /* 书籍网格 */
  .book-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px;
    margin-bottom: 50px;
  }
  
  .book-card {
    background-color: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    cursor: pointer;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .book-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  }
  
  .book-cover {
    height: 260px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #e8eaed;
    padding: 15px;
  }
  
  .book-cover img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.5s ease;
  }
  
  .book-card:hover .book-cover img {
    transform: scale(1.08);
  }
  
  .book-info {
    padding: 25px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .book-title {
    margin: 0 0 15px 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
    text-align: center;
  }
  
  .book-author, .book-chapters {
    margin: 5px 0;
    color: #666;
    font-size: 16px;
    text-align: center;
  }
  
  .book-description {
    margin: 10px 0;
    color: #999;
    font-size: 14px;
    text-align: center;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* 加载状态 */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    min-height: 400px;
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #00a3ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loading-state p {
    color: #6b7280;
    font-size: 16px;
  }
  
  /* 空状态 */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    min-height: 400px;
  }
  
  .empty-icon {
    font-size: 80px;
    opacity: 0.3;
    margin-bottom: 16px;
  }
  
  .empty-state p {
    font-size: 18px;
    color: #9ca3af;
    margin: 8px 0;
  }
  
  .empty-hint {
    font-size: 14px !important;
    color: #6b7280 !important;
  }
  
  /* 弹窗样式 */
  .book-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
  }
  
  .modal-content {
    position: relative;
    z-index: 1001;
    animation: modalFadeIn 0.4s ease;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  .modal-content.fullscreen {
    width: 100%;
    height: 100%;
    max-width: 100%;
    border-radius: 0;
  }
  
  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* 响应式调整 */
  @media (max-width: 992px) {
    .featured-book-card {
      flex-direction: column;
      min-height: auto;
    }
    
    .featured-book-cover, .featured-book-info {
      flex: 0 0 100%;
      max-width: 100%;
    }
    
    .featured-book-cover {
      height: 380px;
    }
  }
  
  @media (max-width: 768px) {
    .book-list-container {
      padding: 20px;
    }
    
    .book-list-header {
      gap: 20px;
    }
    
    .book-list-header h2 {
      font-size: 28px;
    }
    
    .featured-book-title {
      font-size: 26px;
    }
    
    .featured-book-subtitle {
      font-size: 18px;
    }
    
    .featured-book-info {
      padding: 25px;
    }
    
    .book-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    
    .book-cover {
      height: 300px;
    }
    
    .modal-content {
      width: 95%;
      height: 90%;
    }
  }
  
  @media (max-width: 576px) {
    .book-list-header {
      gap: 15px;
    }
    
    .featured-book-cover {
      height: 300px;
      padding: 10px;
    }
    
    .featured-book-buttons {
      flex-direction: column;
      width: 100%;
    }
    
    .featured-book-button {
      width: 100%;
    }
    
    .book-grid {
      grid-template-columns: 1fr;
      max-width: 320px;
      margin: 0 auto;
    }
    
    .book-cover {
      height: 240px;
      padding: 10px;
    }
  }
  </style> 