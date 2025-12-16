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
            <el-form :model="metadata" label-width="120px" label-position="left">
              <el-divider content-position="left">基本信息</el-divider>
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
              <el-form-item label="定价">
                <el-input v-model="metadata.price" />
              </el-form-item>
               <el-form-item label="简介">
                <el-input v-model="metadata.summary" type="textarea" :rows="3" />
              </el-form-item>

              <el-divider content-position="left">出版详情</el-divider>
              <el-form-item label="责任编辑">
                <el-input v-model="metadata.editors" />
              </el-form-item>
              <el-form-item label="责任设计">
                <el-input v-model="metadata.designer" />
              </el-form-item>
              <el-form-item label="社址邮编">
                <el-input v-model="metadata.publisherAddress" />
              </el-form-item>
              <el-form-item label="联系电话">
                <el-input v-model="metadata.phone" />
              </el-form-item>
              <el-form-item label="传真">
                <el-input v-model="metadata.fax" />
              </el-form-item>
              <el-form-item label="网址">
                <el-input v-model="metadata.website" />
              </el-form-item>

              <el-divider content-position="left">印刷信息</el-divider>
              <el-form-item label="印刷厂">
                <el-input v-model="metadata.printer" />
              </el-form-item>
              <el-form-item label="开本">
                <el-input v-model="metadata.format" />
              </el-form-item>
              <el-form-item label="印张">
                <el-input v-model="metadata.sheets" />
              </el-form-item>
              <el-form-item label="字数">
                <el-input v-model="metadata.wordCount" />
              </el-form-item>
              <el-form-item label="版次">
                <el-input v-model="metadata.edition" />
              </el-form-item>
              <el-form-item label="印次">
                <el-input v-model="metadata.printing" />
              </el-form-item>
              <el-form-item label="审图号">
                <el-input v-model="metadata.mapNumber" />
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
      title: '板块构造学现代发展——板块造貌构造学新论（上篇）',
      author: '陈志明',
      publisher: '地质出版社',
      publishDate: '2025-05-01',
      isbn: '978-7-116-14390-6',
      summary: '本书是"亚洲陆海地貌与板块盆构造两图"研制及其《板块构造与地貌形迹——亚欧与太平洋盆构造两图》延伸之"地学新两论"。本书系统阐述板块构造学的现代发展,详细介绍板块造貌构造学的新理论体系。中国国家版本馆CIP数据核字第202494RB36号。',
      // 扩展出版信息
      editors: '顾跃荷 肖坚华 郑长胜 孙敬中',
      designer: '关风云',
      publisherAddress: '北京市海淀区学院路31号，100083',
      phone: '(010) 66554649 (邮购部)；(010) 66554576 (编辑室)',
      website: 'https://www.gph.cingp.com',
      fax: '(010) 66554686',
      printer: '北京地大彩印有限公司',
      format: '787mm×1092mm 1/8',
      sheets: '37.5',
      wordCount: '920千字',
      edition: '2025年5月北京第1版',
      printing: '2025年5月北京第1次印刷',
      mapNumber: 'GS京(2024) 1910号',
      price: '380.00元'
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
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.metadata-form::-webkit-scrollbar {
  width: 6px;
}

.metadata-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.metadata-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.metadata-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.result-actions {
  padding: 16px 0;
  margin-top: 0;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  background: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
