<template>
  <div class="file-details">
    <h2>文件详情</h2>
    <el-row :gutter="20">
      <!-- 左侧：概述 + PDF -->
      <el-col :span="8">
        <div class="left-panel">
          <h3>文章概述</h3>
          <div v-if="file?.details">
            <p>{{ file.details }}</p>
          </div>
          <div v-else>
            <p>暂无概述</p>
          </div>

          <h3>PDF文件</h3>
          <div v-if="isPdf">
            <div id="pdf-container"></div> <!-- PDF 渲染区域 -->
          </div>
        </div>
      </el-col>

      <!-- 中间：MD 文件 -->
      <el-col :span="8">
        <div class="middle-panel">
          <h3>Markdown 文件</h3>
          <div v-if="isMd">
            <div id="md-container" v-html="markdownContent"></div> <!-- Markdown 渲染区域 -->
          </div>
          <div v-else>
            <p>暂无Markdown文件</p>
          </div>
        </div>
      </el-col>

      <!-- 右侧：图片 -->
      <el-col :span="8">
        <div class="right-panel">
          <h3>文件图片</h3>
          <div v-if="file?.file_type === 'image'">
            <img :src="file?.file_path" alt="图片展示" width="100%" />
          </div>
          <div v-else>
            <p>暂无图片</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-button type="primary" @click="goBack" style="margin-top: 20px;">返回</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as pdfjsLib from 'pdfjs-dist';
import { marked } from 'marked'; // 引入marked.js用于渲染Markdown

// 设置 Worker 的路径，确保路径正确指向你的 pdf.worker.min.mjs 文件
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface FileDetail {
  id: number;
  property: string;
  file_type: string;
  file_path: string;
  details?: string;
}

export default defineComponent({
  setup() {
    const file = ref<FileDetail | null>(null);
    const markdownContent = ref<string>(''); // 用于存储渲染后的 Markdown 内容
    const isPdf = ref(false);  // 判断是否是PDF文件
    const isMd = ref(false);   // 判断是否是MD文件
    const route = useRoute();
    const router = useRouter();
    const currentPage = ref(1); // 当前页码
    const totalPages = ref(0);  // 总页数

    // 根据文件ID获取文件详情
    const fetchFileDetails = async () => {
      const fileId = route.params.id;
      try {
        const response = await fetch(`http://localhost:8080/api/files/details/${fileId}`);
        if (response.ok) {
          file.value = await response.json();
          const filePath = file.value?.file_path;
          
          if (filePath) {
            // 判断文件类型
            const fileExtension = filePath.split('.').pop()?.toLowerCase(); // 获取文件后缀

            if (fileExtension === 'pdf') {
              isPdf.value = true;
              loadPdf(`http://localhost:8080${filePath}`);  // 加载 PDF
            } else if (fileExtension === 'md') {
              isMd.value = true;
              loadMarkdown(`http://localhost:8080${filePath}`);  // 加载 Markdown
            }
          }
        } else {
          console.error('获取文件详情失败', await response.text());
          ElMessage.error('获取文件详情失败');
        }
      } catch (error) {
        console.error('获取文件详情失败', error);
        ElMessage.error('网络错误，请稍后再试');
      }
    };

    // 加载PDF文件
    const loadPdf = (url: string) => {
      const loadingTask = pdfjsLib.getDocument(url);
      loadingTask.promise.then((pdf) => {
        totalPages.value = pdf.numPages;
        renderPage(currentPage.value, pdf);  // 渲染当前页

        // 监听滚轮事件进行翻页
        const pdfContainer = document.getElementById('pdf-container');
        if (pdfContainer) {
          pdfContainer.addEventListener('wheel', (event) => {
            if (event.deltaY > 0) {
              // 向下滚动，翻到下一页
              if (currentPage.value < totalPages.value) {
                currentPage.value++;
                renderPage(currentPage.value, pdf);
              }
            } else {
              // 向上滚动，翻到上一页
              if (currentPage.value > 1) {
                currentPage.value--;
                renderPage(currentPage.value, pdf);
              }
            }
          });
        }
      }).catch((error) => {
        console.error('Error loading PDF:', error);
        ElMessage.error('加载 PDF 失败');
      });
    };

    // 渲染页面
    const renderPage = (pageNum: number, pdf: any) => {
      pdf.getPage(pageNum).then((page) => {
        const scale = 1.5; // 缩放比例
        const viewport = page.getViewport({ scale });

        // 创建 canvas 元素
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // 渲染当前页到 canvas
        page.render({
          canvasContext: context!,
          viewport: viewport,
        }).promise.then(() => {
          // 将 canvas 元素插入到容器中
          const pdfContainer = document.getElementById('pdf-container');
          if (pdfContainer) {
            pdfContainer.innerHTML = ''; // 清空之前的内容
            pdfContainer.appendChild(canvas);
          }
        });
      });
    };

    // 加载Markdown文件
    const loadMarkdown = async (url: string) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const mdContent = await response.text();
          markdownContent.value = marked(mdContent);  // 通过marked解析Markdown内容
        } else {
          ElMessage.error('加载 Markdown 文件失败');
        }
      } catch (error) {
        console.error('加载 Markdown 失败', error);
        ElMessage.error('加载 Markdown 文件失败');
      }
    };

    const goBack = () => {
      router.go(-1);
    };

    onMounted(fetchFileDetails);

    return {
      file,
      goBack,
      markdownContent,
      isPdf,
      isMd,
    };
  },
});
</script>

<style scoped>
.file-details {
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  color: #333;
  box-sizing: border-box;
}

.el-row {
  margin-top: 20px;
  flex-grow: 1;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}

.el-col {
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  box-sizing: border-box;
}

h2 {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  color: #222;
}

h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #111;
  border-bottom: 2px solid #ddd;
  padding-bottom: 5px;
}

.left-panel, .middle-panel, .right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

#pdf-container, #md-container {
  width: 100%;
  height: 1000px; /* 固定高度，方便滚动显示 */
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  overflow-y: auto; /* 只允许垂直方向滚动 */
  overflow-x: hidden; /* 禁止水平方向滚动 */
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

#md-container::-webkit-scrollbar {
  width: 8px; /* 滚动条宽度 */
}

#md-container::-webkit-scrollbar-thumb {
  background-color: #888; /* 滚动条颜色 */
  border-radius: 4px; /* 滚动条圆角 */
}

#md-container::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* 滚动条 hover 颜色 */
}

img {
  border-radius: 8px;
  width: 100%;
  height: auto;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

p {
  line-height: 1.6;
  font-size: 16px;
  color: #444;
}

.el-button {
  align-self: center;
  width: 150px;
  height: 40px;
  margin-top: 20px;
  font-size: 16px;
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.el-button:hover {
  background-color: #2563eb;
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);
}

.el-button:focus {
  outline: none;
}

@media (max-width: 768px) {
  .el-row {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  h2 {
    font-size: 20px;
  }

  h3 {
    font-size: 18px;
  }

  .el-button {
    width: 100%;
  }
}
</style>


