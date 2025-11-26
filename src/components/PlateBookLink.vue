<template>
  <div class="plate-book-link">
    <h4>板块与书籍联动</h4>
    <p class="description">查看每个板块对应的书籍章节，点击可跳转到相应章节</p>
    
    <!-- 加载按钮 -->
    <div class="load-section">
      <button @click="loadPlateBookLinks" :disabled="loading" class="load-btn">
        {{ loading ? '加载中...' : '加载板块关联' }}
      </button>
    </div>
    
    <!-- 状态消息 -->
    <div v-if="statusMsg" class="status-msg" :class="{'error': isError}">
      {{ statusMsg }}
    </div>
    
    <!-- 板块书籍关联列表 - 分组显示 -->
    <div v-if="plateLinks.length > 0" class="plate-links-container">
      
      <!-- 二级板块分组 -->
      <div class="plate-group">
        <div class="group-header" @click="toggleGroup('level2')">
          <span class="group-title">二级板块</span>
          <div class="group-info">
            <span class="group-count">{{ level2Plates.length }} 个</span>
            <span class="toggle-icon" :class="{'expanded': expandedGroups.level2}">›</span>
          </div>
        </div>
        
        <div v-show="expandedGroups.level2" class="group-content">
          <div v-for="(plate, index) in level2Plates" :key="'l2-' + index" class="plate-link-card">
            <div class="plate-header" @click="togglePlate('l2-' + index)">
              <span class="plate-name">{{ plate.plateName }}</span>
              <div class="plate-actions">
                <span class="chapter-count">{{ plate.chapters?.length || 0 }} 章节</span>
                <span class="toggle-icon" :class="{'expanded': expandedPlates['l2-' + index]}">›</span>
              </div>
            </div>
            
            <div v-show="expandedPlates['l2-' + index]" class="chapters-list">
              <div v-if="plate.chapters && plate.chapters.length > 0">
                <div v-for="(chapter, chapterIndex) in plate.chapters" :key="chapterIndex" class="chapter-item">
                  <div class="chapter-info">
                    <span class="chapter-number">{{ chapterIndex + 1 }}</span>
                    <span class="chapter-title">{{ chapter.title }}</span>
                  </div>
                  <button 
                    @click="jumpToChapter(chapter, plate.plateName)" 
                    class="jump-btn"
                    :disabled="jumpingChapter === chapter.title"
                  >
                    {{ jumpingChapter === chapter.title ? '加载中...' : '跳转' }}
                  </button>
                </div>
              </div>
              <div v-else class="no-chapters">暂无关联章节</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 三级板块分组 -->
      <div class="plate-group">
        <div class="group-header" @click="toggleGroup('level3')">
          <span class="group-title">三级板块</span>
          <div class="group-info">
            <span class="group-count">{{ level3Plates.length }} 个</span>
            <span class="toggle-icon" :class="{'expanded': expandedGroups.level3}">›</span>
          </div>
        </div>
        
        <div v-show="expandedGroups.level3" class="group-content">
          <div v-for="(plate, index) in level3Plates" :key="'l3-' + index" class="plate-link-card">
            <div class="plate-header" @click="togglePlate('l3-' + index)">
              <span class="plate-name">{{ plate.plateName }}</span>
              <div class="plate-actions">
                <span class="chapter-count">{{ plate.chapters?.length || 0 }} 章节</span>
                <span class="toggle-icon" :class="{'expanded': expandedPlates['l3-' + index]}">›</span>
              </div>
            </div>
            
            <div v-show="expandedPlates['l3-' + index]" class="chapters-list">
              <div v-if="plate.chapters && plate.chapters.length > 0">
                <div v-for="(chapter, chapterIndex) in plate.chapters" :key="chapterIndex" class="chapter-item">
                  <div class="chapter-info">
                    <span class="chapter-number">{{ chapterIndex + 1 }}</span>
                    <span class="chapter-title">{{ chapter.title }}</span>
                  </div>
                  <button 
                    @click="jumpToChapter(chapter, plate.plateName)" 
                    class="jump-btn"
                    :disabled="jumpingChapter === chapter.title"
                  >
                    {{ jumpingChapter === chapter.title ? '加载中...' : '跳转' }}
                  </button>
                </div>
              </div>
              <div v-else class="no-chapters">暂无关联章节</div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="!loading && plateLinks.length === 0 && !statusMsg" class="empty-state">
      <p>点击上方按钮加载板块与书籍的关联信息</p>
    </div>
    
    <!-- Markdown内容查看器 -->
    <div v-if="showViewer" class="markdown-viewer-overlay" @click="closeViewer">
      <div class="markdown-viewer-container" @click.stop>
        <div class="viewer-header">
          <div class="viewer-title">
            <span class="title-text">{{ currentChapter?.title }}</span>
            <span class="title-subtitle" v-if="currentChapter?.plateName">
              {{ currentChapter.plateName }}
            </span>
          </div>
          <button class="close-btn" @click="closeViewer">
            <span class="close-icon">×</span>
          </button>
        </div>
        <div class="viewer-content">
          <div v-if="viewerLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="markdownContent" class="markdown-body" v-html="renderedMarkdown"></div>
          <div v-else class="empty-content">
            <p>暂无内容</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import { marked } from 'marked';

// 章节数据结构
interface Chapter {
  title: string;
  path: string;
  fileId?: number;
  markdownUrl?: string;
}

interface PlateLink {
  plateName: string;
  plateCode: string;
  level: number;
  chapters: Chapter[];
}

// 定义emit事件
const emit = defineEmits<{
  'open-chapter': [chapter: Chapter, content: string]
}>();

const loading = ref(false);
const statusMsg = ref('');
const isError = ref(false);
const plateLinks = ref<PlateLink[]>([]);
const expandedPlates = ref<Record<string, boolean>>({});
const expandedGroups = ref({
  level2: true,
  level3: false
});
const jumpingChapter = ref<string | null>(null);

// Markdown查看器状态
const showViewer = ref(false);
const viewerLoading = ref(false);
const markdownContent = ref('');
const currentChapter = ref<Chapter & { plateName?: string } | null>(null);

// 计算属性：二级板块
const level2Plates = computed(() => {
  return plateLinks.value.filter(plate => plate.level === 2);
});

// 计算属性：三级板块
const level3Plates = computed(() => {
  return plateLinks.value.filter(plate => plate.level === 3);
});

// 计算属性：渲染后的Markdown
const renderedMarkdown = computed(() => {
  if (!markdownContent.value) return '';
  return marked(markdownContent.value) as string;
});

// 加载板块书籍关联数据
async function loadPlateBookLinks() {
  loading.value = true;
  statusMsg.value = '';
  isError.value = false;
  
  try {
    console.log('开始加载板块关联数据...');
    
    // 1. 获取第一本书的所有md文件
    const mdFilesUrl = 'http://localhost:8080/api/files/markdown?bookId=1';
    const mdResponse = await axios.get(mdFilesUrl);
    console.log('获取到的第一本书md文件列表:', mdResponse.data);
    
    const mdFiles = mdResponse.data?.files || [];
    
    // 创建property到fileId的映射
    const propertyToFileMap = new Map<string, any>();
    mdFiles.forEach((file: any) => {
      if (file.property && file.id) {
        propertyToFileMap.set(file.property, file);
      }
    });
    
    console.log('Property到文件的映射:', propertyToFileMap);
    
    // 2. 定义板块与property的映射关系（前端配置，无需后端接口）
    const plateData = [
      {
        plateName: '澳洲',
        plateCode: 'AZ',
        level: 2,
        chapters: [
          { title: '2.3', path: '/books/geology/2.3.md' }
        ]
      },
      {
        plateName: '东南亚-班达海',
        plateCode: 'DNY_BDH',
        level: 2,
        chapters: [
          { title: '4.5', path: '/books/geology/4.5.md' }
        ]
      },
      {
        plateName: '两苏海',
        plateCode: 'LSH',
        level: 2,
        chapters: [
          { title: '4.7', path: '/books/geology/4.7.md' }
        ]
      },
      {
        plateName: '大印度',
        plateCode: 'DYD',
        level: 2,
        chapters: [
          { title: '2.2', path: '/books/geology/2.2.md' }
        ]
      },
      {
        plateName: '南海',
        plateCode: 'NH',
        level: 2,
        chapters: [
          { title: '4.6', path: '/books/geology/4.6.md' }
        ]
      },
      {
        plateName: '泛非洲',
        plateCode: 'FFZ',
        level: 2,
        chapters: [
          { title: '2.1', path: '/books/geology/2.1.md' }
        ]
      },
      {
        plateName: '菲律宾海',
        plateCode: 'FLBH',
        level: 2,
        chapters: []
      },
      {
        plateName: '华南',
        plateCode: 'HN',
        level: 2,
        chapters: [
          { title: '4.4', path: '/books/geology/4.4.md' }
        ]
      },
      {
        plateName: '路间东特提斯',
        plateCode: 'LJDTTS',
        level: 2,
        chapters: [
          { title: '3.3', path: '/books/geology/3.3.md' }
        ]
      },
      {
        plateName: '华北',
        plateCode: 'HB',
        level: 2,
        chapters: [
          { title: '4.3', path: '/books/geology/4.3.md' }
        ]
      },
      {
        plateName: '东北亚',
        plateCode: 'DBY',
        level: 2,
        chapters: [
          { title: '4.2', path: '/books/geology/4.2.md' }
        ]
      },
      {
        plateName: '中亚',
        plateCode: 'ZY',
        level: 2,
        chapters: [
          { title: '1.5', path: '/books/geology/1.5.md' }
        ]
      },
      {
        plateName: '北亚',
        plateCode: 'BY',
        level: 2,
        chapters: [
          { title: '1.4', path: '/books/geology/1.4.md' }
        ]
      },
      {
        plateName: '北极区',
        plateCode: 'BJQ',
        level: 2,
        chapters: [
          { title: '4.1', path: '/books/geology/4.1.md' }
        ]
      },
      // 三级板块
      {
        plateName: '班达海',
        plateCode: 'BDH',
        level: 3,
        chapters: [
          { title: '4.5.2.4.D', path: '/books/geology/4.5.2.4.D.md' }
        ]
      },
      {
        plateName: '毕地延定',
        plateCode: 'BDYD',
        level: 3,
        chapters: [
          { title: '4.5.2.3.C', path: '/books/geology/4.5.2.3.C.md' }
        ]
      },
      {
        plateName: '孟加拉湾',
        plateCode: 'MJLW',
        level: 3,
        chapters: [
          { title: '2.2.5.2.B', path: '/books/geology/2.2.5.2.B.md' }
        ]
      },
      {
        plateName: '西面_宾达曼',
        plateCode: 'XM_BDM',
        level: 3,
        chapters: [
          { title: '4.5.2.1.A', path: '/books/geology/4.5.2.1.A.md' }
        ]
      },
      {
        plateName: '阿拉伯',
        plateCode: 'ALB',
        level: 3,
        chapters: [
          { title: '2.1.2.3.H', path: '/books/geology/2.1.2.3.H.md' }
        ]
      },
      {
        plateName: '印支半岛',
        plateCode: 'YZBD',
        level: 3,
        chapters: [
          { title: '4.5.2.2.B', path: '/books/geology/4.5.2.2.B.md' }
        ]
      },
      {
        plateName: '印度半岛',
        plateCode: 'YDBD',
        level: 3,
        chapters: [
          { title: '2.2.5.2.B', path: '/books/geology/2.2.5.2.B.md' },
          { title: '2.2.5.1.A', path: '/books/geology/2.2.5.1.A.md' }
        ]
      },
      {
        plateName: '无德_喜马拉雅',
        plateCode: 'WD_XMLY',
        level: 3,
        chapters: [
          { title: '3.3.4.4.D', path: '/books/geology/3.3.4.4.D.md' }
        ]
      },
      {
        plateName: '青东南_朝鲜半岛',
        plateCode: 'QDN_CXBD',
        level: 3,
        chapters: [
          { title: '4.3.2.2.B', path: '/books/geology/4.3.2.2.B.md' }
        ]
      },
      {
        plateName: '拉达克_察隅达木',
        plateCode: 'LDK_CYDM',
        level: 3,
        chapters: [
          { title: '3.3.4.1.A', path: '/books/geology/3.3.4.1.A.md' }
        ]
      },
      {
        plateName: '华北',
        plateCode: 'HB_3',
        level: 3,
        chapters: [
          { title: '4.3.2.3.C', path: '/books/geology/4.3.2.3.C.md' },
          { title: '4.3.2.1.A', path: '/books/geology/4.3.2.1.A.md' }
        ]
      },
      {
        plateName: '塔里木',
        plateCode: 'TLM',
        level: 3,
        chapters: [
          { title: '1.5.3.3.C', path: '/books/geology/1.5.3.3.C.md' }
        ]
      },
      {
        plateName: '近东_日本',
        plateCode: 'JD_RB',
        level: 3,
        chapters: [
          { title: '4.2.2.3.C', path: '/books/geology/4.2.2.3.C.md' }
        ]
      },
      {
        plateName: '古亚洲_卡拉库姆',
        plateCode: 'GYZ_KLKM',
        level: 3,
        chapters: [
          { title: '1.5.3.2.B', path: '/books/geology/1.5.3.2.B.md' }
        ]
      },
      {
        plateName: '南方江',
        plateCode: 'NFJ',
        level: 3,
        chapters: [
          { title: '4.2.2.5.B', path: '/books/geology/4.2.2.5.B.md' },
          { title: '4.2.2.2.B', path: '/books/geology/4.2.2.2.B.md' }
        ]
      },
      {
        plateName: '中北',
        plateCode: 'ZB',
        level: 3,
        chapters: [
          { title: '1.5.3.1.A', path: '/books/geology/1.5.3.1.A.md' }
        ]
      },
      {
        plateName: '东古城',
        plateCode: 'DGC',
        level: 3,
        chapters: [
          { title: '1.4.3.4.D', path: '/books/geology/1.4.3.4.D.md' },
          { title: '1.4.2.2.B', path: '/books/geology/1.4.2.2.B.md' },
          { title: '1.5.3.1.A', path: '/books/geology/1.5.3.1.A.md' }
        ]
      },
      {
        plateName: '西伯利亚',
        plateCode: 'XBLY',
        level: 3,
        chapters: [
          { title: '1.4.3.3.C', path: '/books/geology/1.4.3.3.C.md' },
          { title: '1.4.3.1.A', path: '/books/geology/1.4.3.1.A.md' }
        ]
      },
      {
        plateName: '末梢尔',
        plateCode: 'MSE',
        level: 3,
        chapters: [
          { title: '1.4.3.2.B', path: '/books/geology/1.4.3.2.B.md' }
        ]
      }
    ];
    
    // 3. 为每个章节匹配fileId
    plateData.forEach((plate: PlateLink) => {
      if (plate.chapters && plate.chapters.length > 0) {
        plate.chapters = plate.chapters.map((chapter: Chapter) => {
          const property = chapter.title; // title即为property
          const fileInfo = propertyToFileMap.get(property);
          
          if (fileInfo) {
            return {
              ...chapter,
              fileId: fileInfo.id,
              path: fileInfo.file_path
            };
          }
          return chapter;
        });
      }
    });
    
    plateLinks.value = plateData;
    
    // 统计有fileId的章节数
    const chaptersWithFile = plateLinks.value.reduce((count, plate) => {
      return count + (plate.chapters?.filter(c => c.fileId).length || 0);
    }, 0);
    
    // 默认展开第一个板块
    if (plateLinks.value.length > 0) {
      expandedPlates.value['l2-0'] = true;
    }
    
    statusMsg.value = `成功加载 ${plateLinks.value.length} 个板块的关联信息，匹配到 ${chaptersWithFile} 个章节文件`;
    console.log('处理后的板块数据:', plateLinks.value);
    
  } catch (error: any) {
    isError.value = true;
    statusMsg.value = `加载失败: ${error.message || '未知错误'}`;
    plateLinks.value = [];
  } finally {
    loading.value = false;
  }
}

// 切换分组展开/折叠状态
function toggleGroup(groupKey: 'level2' | 'level3') {
  expandedGroups.value[groupKey] = !expandedGroups.value[groupKey];
}

// 切换板块展开/折叠状态
function togglePlate(key: string) {
  expandedPlates.value[key] = !expandedPlates.value[key];
}

// 跳转到章节（打开查看器）
async function jumpToChapter(chapter: Chapter, plateName?: string) {
  console.log('跳转到章节:', chapter);
  
  // 如果没有fileId，提示用户
  if (!chapter.fileId) {
    statusMsg.value = `章节 ${chapter.title} 暂无关联的文档ID`;
    isError.value = true;
    setTimeout(() => {
      statusMsg.value = '';
      isError.value = false;
    }, 3000);
    return;
  }
  
  try {
    jumpingChapter.value = chapter.title;
    viewerLoading.value = true;
    showViewer.value = true;
    
    // 设置当前章节信息
    currentChapter.value = {
      ...chapter,
      plateName
    };
    
    // 直接调用正确的文件内容API
    const url = `http://localhost:8080/api/files/markdown/${chapter.fileId}/content`;
    console.log('请求章节内容 URL:', url);
    
    const response = await axios.get(url);
    const content = response.data?.content || '';
    
    console.log('获取到的章节内容长度:', content.length);
    
    // 设置Markdown内容
    markdownContent.value = content;
    
    // 同时通过emit事件通知父组件（如果父组件需要）
    emit('open-chapter', chapter, content);
    
    statusMsg.value = `成功加载章节: ${chapter.title}`;
    isError.value = false;
    
    setTimeout(() => {
      statusMsg.value = '';
    }, 2000);
    
  } catch (error: any) {
    console.error('加载章节失败:', error);
    statusMsg.value = `加载章节失败: ${error.message || '未知错误'}`;
    isError.value = true;
    
    setTimeout(() => {
      statusMsg.value = '';
      isError.value = false;
    }, 3000);
  } finally {
    jumpingChapter.value = null;
    viewerLoading.value = false;
  }
}

// 关闭Markdown查看器
function closeViewer() {
  showViewer.value = false;
  markdownContent.value = '';
  currentChapter.value = null;
}
</script>

<style scoped>
.plate-book-link {
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.plate-book-link h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.description {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}

/* 加载按钮 */
.load-section {
  margin-bottom: 16px;
}

.load-btn {
  width: 100%;
  padding: 10px 16px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-btn:hover:not(:disabled) {
  background: #5daf34;
}

.load-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 状态消息 */
.status-msg {
  padding: 10px 12px;
  background: rgba(103, 194, 58, 0.08);
  border-left: 3px solid #67c23a;
  border-radius: 4px;
  color: #67c23a;
  font-size: 13px;
  margin-bottom: 16px;
}

.status-msg.error {
  background: rgba(245, 108, 108, 0.08);
  border-left-color: #f56c6c;
  color: #f56c6c;
}

/* 板块关联列表容器 */
.plate-links-container {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.plate-links-container::-webkit-scrollbar {
  width: 4px;
}

.plate-links-container::-webkit-scrollbar-track {
  background: transparent;
}

.plate-links-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

/* 分组样式 */
.plate-group {
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.15);
  transition: background 0.2s ease;
}

.group-header:hover {
  background: rgba(0, 0, 0, 0.25);
}

.group-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.group-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.group-content {
  padding: 8px;
}

/* 板块卡片 */
.plate-link-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: background 0.2s ease;
}

.plate-link-card:last-child {
  margin-bottom: 0;
}

.plate-link-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* 板块头部 */
.plate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.plate-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.plate-name {
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.95);
}

.plate-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chapter-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.toggle-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.2s ease;
  transform: rotate(-90deg);
}

.toggle-icon.expanded {
  transform: rotate(0deg);
}

/* 章节列表 */
.chapters-list {
  padding: 8px 14px 12px 14px;
  background: rgba(0, 0, 0, 0.08);
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  margin-bottom: 6px;
  transition: background 0.2s ease;
  gap: 12px;
}

.chapter-item:last-child {
  margin-bottom: 0;
}

.chapter-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.chapter-number {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
  min-width: 16px;
}

.chapter-title {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 跳转按钮 */
.jump-btn {
  padding: 6px 14px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.jump-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.jump-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 无章节状态 */
.no-chapters {
  text-align: center;
  padding: 16px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

/* Markdown查看器样式 */
.markdown-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.markdown-viewer-container {
  width: 90%;
  max-width: 1200px;
  height: 85vh;
  background: #1e1e1e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.viewer-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.title-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.close-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1;
}

.viewer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.viewer-content::-webkit-scrollbar {
  width: 8px;
}

.viewer-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.viewer-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.viewer-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.empty-content {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);
}

/* Markdown内容样式 */
.markdown-body {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  font-size: 15px;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  color: #fff;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.3em;
}

.markdown-body h3 { font-size: 1.25em; }
.markdown-body h4 { font-size: 1em; }
.markdown-body h5 { font-size: 0.875em; }
.markdown-body h6 { font-size: 0.85em; }

.markdown-body p {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-bottom: 8px;
}

.markdown-body code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.markdown-body pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  border-radius: 6px;
  margin-bottom: 16px;
}

.markdown-body pre code {
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: 100%;
  border-radius: 0;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: rgba(255, 255, 255, 0.6);
  border-left: 0.25em solid rgba(255, 255, 255, 0.2);
  margin: 0 0 16px 0;
}

.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.markdown-body table th {
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
}

.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 16px 0;
}

.markdown-body a {
  color: #409eff;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: rgba(255, 255, 255, 0.1);
  border: 0;
}
</style>
