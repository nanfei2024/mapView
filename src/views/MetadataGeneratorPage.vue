<template>
  <div class="metadata-generator-page">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          返回
        </button>
        <h1 class="page-title">元数据生成</h1>
      </div>
    </div>

    <div class="content-container">
      <div class="upload-section">
        <el-card class="upload-card">
          <template #header>
            <div class="card-header">
              <span>上传书籍封面</span>
            </div>
          </template>
          <el-upload
            class="cover-uploader"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
          >
            <div v-if="imageUrl" class="uploaded-image-container">
              <img :src="imageUrl" class="uploaded-image" />
              <div class="reupload-mask">
                <span>点击更换图片</span>
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                拖拽图片到此处或 <em>点击上传</em>
              </div>
              <div class="el-upload__tip">
                支持 JPG/PNG 文件，建议尺寸 3:4
              </div>
            </div>
          </el-upload>
          
          <div class="action-area">
            <el-button type="primary" size="large" @click="generateMetadata" :loading="analyzing" :disabled="!imageUrl" class="generate-btn">
              {{ analyzing ? '正在识别中...' : '开始生成元数据' }}
            </el-button>
          </div>
        </el-card>
      </div>

      <div class="result-section">
        <el-card class="result-card" v-loading="analyzing" element-loading-text="AI正在分析封面信息...">
          <template #header>
            <div class="card-header">
              <span>识别结果</span>
              <el-tag v-if="metadata" type="success" size="small">识别成功</el-tag>
            </div>
          </template>
          
          <div v-if="metadata" class="metadata-form">
            <el-form :model="metadata" label-width="100px" label-position="left">
              <el-form-item label="书籍标题">
                <el-input v-model="metadata.title" />
              </el-form-item>
              <el-form-item label="作者">
                <el-input v-model="metadata.author" />
              </el-form-item>
              <el-form-item label="出版社">
                <el-input v-model="metadata.publisher" />
              </el-form-item>
               <el-form-item label="出版时间">
                <el-date-picker
                  v-model="metadata.publishDate"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </el-form-item>
               <el-form-item label="ISBN">
                <el-input v-model="metadata.isbn" />
              </el-form-item>
               <el-form-item label="简介">
                <el-input v-model="metadata.summary" type="textarea" :rows="4" />
              </el-form-item>
            </el-form>
             <div class="result-actions">
               <el-button type="success" @click="saveMetadata">保存元数据</el-button>
             </div>
          </div>
          
          <div v-else class="empty-state">
            <el-empty description="暂无识别数据，请先上传封面" />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { UploadFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const imageUrl = ref('');
const analyzing = ref(false);
const metadata = ref<any>(null);

const goBack = () => {
  router.back();
};

const handleFileChange = (uploadFile: any) => {
  if (uploadFile.raw) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageUrl.value = e.target?.result as string;
      metadata.value = null; // Reset metadata on new image
    };
    reader.readAsDataURL(uploadFile.raw);
  }
};

const generateMetadata = () => {
  if (!imageUrl.value) return;
  
  analyzing.value = true;
  
  // Simulate AI Analysis
  setTimeout(() => {
    analyzing.value = false;
    metadata.value = {
      title: '示例书籍名称',
      author: '张三',
      publisher: '示例出版社',
      publishDate: '2023-10-01',
      isbn: '978-7-111-11111-1',
      summary: '这是一本关于示例内容的精彩书籍，内容涵盖了...'
    };
    ElMessage.success('元数据识别成功');
  }, 2000);
};

const saveMetadata = () => {
  ElMessage.success('保存成功');
  // Logic to save data would go here
};
</script>

<style scoped>
.metadata-generator-page {
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.page-header {
  background: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #f0f2f5;
  color: #409eff;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.content-container {
  flex: 1;
  padding: 24px;
  display: flex;
  gap: 24px;
  overflow: hidden;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.upload-section {
  flex: 1;
  max-width: 500px;
  display: flex;
  flex-direction: column;
}

.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.upload-card, .result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.upload-card :deep(.el-card__body), .result-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.cover-uploader {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.cover-uploader :deep(.el-upload) {
  width: 100%;
  height: 100%;
  display: flex;
}
.cover-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.uploaded-image-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
}

.uploaded-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.reupload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.uploaded-image-container:hover .reupload-mask {
  opacity: 1;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.action-area {
  margin-top: 20px;
}

.generate-btn {
  width: 100%;
  font-weight: 600;
}

.metadata-form {
  padding: 20px 0;
}

.result-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
