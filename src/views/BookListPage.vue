<template>
    <div class="book-list-container">
      <div class="book-list-header">
        <h2>地质科学书籍馆</h2>
        <button class="back-btn" @click="goBack">返回地图</button>
      </div>
      
      <div class="book-list-content">
        <div class="featured-book">
          <div class="featured-book-card" @click="openBookDetails(books[0])">
            <div class="featured-book-cover">
              <img :src="books[0].coverUrl" :alt="books[0].title" />
            </div>
            <div class="featured-book-info">
              <h3 class="featured-book-title">{{ books[0].title }}</h3>
              <p class="featured-book-subtitle">亚欧与太平洋造貌构造响应</p>
              <p class="featured-book-author">作者: {{ books[0].author }}</p>
              <p class="featured-book-publisher">湖南出版社</p>
              <p class="featured-book-description">
                本书详细阐述了板块构造理论与地貌形成的关系，重点研究劳亚区系、冈瓦纳区系和特提斯陆间带的地质特征及其演化过程。
                通过对亚欧大陆与太平洋板块相互作用的深入分析，揭示了地质构造对地表形态的塑造机制。
              </p>
              <div class="featured-book-button">
                查看详情
              </div>
            </div>
          </div>
        </div>
        
        <h3 class="section-title">相关推荐</h3>
        
        <div class="book-grid">
          <div 
            v-for="book in relatedBooks" 
            :key="book.id" 
            class="book-card"
            @click="openBookDetails(book)"
          >
            <div class="book-cover">
              <img :src="book.coverUrl" :alt="book.title" />
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">作者: {{ book.author }}</p>
              <p class="book-chapters">章节数: {{ book.chapters.length }}</p>
            </div>
          </div>
        </div>
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
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import BookViewer from '../components/BookViewer.vue';
  
  // 定义书籍接口
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
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    chapters: Chapter[];
  }
  
  const router = useRouter();
  
  // 主要书籍和相关推荐书籍数据
  const books = ref<Book[]>([
    {
      id: '1',
      title: '板块构造与地貌形迹',
      author: '陈志明',
      coverUrl: '/images/板块构造与地貌形迹.jpg', // 简化文件名
      chapters: [
        {
          title: '第一章：劳亚区系',
          chapter: '1',
          sections: [
            { title: '1.1 劳亚区系概述', pageNumber: 1 },
            { title: '1.2 劳亚区系的地质特征', pageNumber: 5 },
            { title: '1.3 劳亚区系的演化', pageNumber: 10 }
          ]
        },
        {
          title: '第二章：冈瓦纳区系',
          chapter: '2',
          sections: [
            { title: '2.1 冈瓦纳区系概述', pageNumber: 15 },
            { title: '2.2 冈瓦纳区系的地质特征', pageNumber: 20 },
            { title: '2.3 冈瓦纳区系的演化', pageNumber: 25 }
          ]
        },
        {
          title: '第三章：特提斯陆间带',
          chapter: '3',
          sections: [
            { title: '3.1 特提斯陆间带概述', pageNumber: 30 },
            { title: '3.2 特提斯陆间带的地质特征', pageNumber: 35 },
            { title: '3.3 特提斯陆间带的演化', pageNumber: 40 }
          ]
        }
      ]
    }
  ]);
  
  // 相关推荐书籍
  const relatedBooks = ref<Book[]>([
    {
      id: '2',
      title: '板块构造与地貌形迹',
      author: '陈志明',
      coverUrl: '/images/板块构造与地貌形迹下.jpg', // 使用本地图片
      chapters: [
        {
          title: '第一章：地球内部结构',
          chapter: '1',
          sections: [
            { title: '1.1 地壳', pageNumber: 1 },
            { title: '1.2 地幔', pageNumber: 8 }
          ]
        },
        {
          title: '第二章：地球物理场',
          chapter: '2',
          sections: [
            { title: '2.1 重力场', pageNumber: 15 },
            { title: '2.2 磁场', pageNumber: 22 }
          ]
        }
      ]
    },
    {
      id: '3',
      title: '亚洲地貌圈及其板块造貌构造纲要',
      author: '陈志明',
      coverUrl: '/images/亚洲地貌圈及其板块造貌构造纲要.jpg', // 使用本地图片
      chapters: [
        {
          title: '第一章：构造地质学基础',
          chapter: '1',
          sections: [
            { title: '1.1 构造地质学的研究对象', pageNumber: 1 },
            { title: '1.2 构造地质学的研究方法', pageNumber: 7 }
          ]
        },
        {
          title: '第二章：地质构造类型',
          chapter: '2',
          sections: [
            { title: '2.1 褶皱构造', pageNumber: 15 },
            { title: '2.2 断层构造', pageNumber: 25 }
          ]
        }
      ]
    },
    {
      id: '4',
      title: '地学新两论 上篇 ',
      author: '陈志明',
      coverUrl: '/images/地学新两论 上篇 板块造貌构造学-兼论板块学说新发展.jpg', // 使用本地图片
      chapters: [
        {
          title: '第一章：地貌测量技术',
          chapter: '1',
          sections: [
            { title: '1.1 传统测量方法', pageNumber: 1 },
            { title: '1.2 现代遥感技术', pageNumber: 10 }
          ]
        },
        {
          title: '第二章：地貌分析',
          chapter: '2',
          sections: [
            { title: '2.1 形态分析', pageNumber: 20 },
            { title: '2.2 过程分析', pageNumber: 30 }
          ]
        }
      ]
    }
  ]);
  
  // 控制书籍详情弹窗
  const showBookModal = ref(false);
  const selectedBook = ref<Book | undefined>(undefined);
  
  // 打开书籍详情
  const openBookDetails = (book: Book) => {
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
  
  .featured-book-button {
    align-self: flex-start;
    padding: 12px 25px;
    background: linear-gradient(135deg, #00e5b0 0%, #00a3ff 100%);
    color: white;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 163, 255, 0.2);
    text-align: center;
  }
  
  .featured-book-card:hover .featured-book-button {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 163, 255, 0.3);
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