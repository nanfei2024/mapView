<template>
  <div class="markdown-uploader">
    <div class="upload-area" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
      <input 
        ref="fileInput" 
        type="file" 
        accept=".md,.markdown,.txt" 
        @change="handleFileSelect" 
        style="display: none"
      >
      <div class="upload-icon">📄</div>
      <h3>上传 Markdown 文件</h3>
      <p>点击或拖拽 .md 文件到此处</p>
      <p class="hint">支持格式: .md, .markdown, .txt</p>
    </div>
    
    <div v-if="fileName" class="file-info">
      <span class="file-name">{{ fileName }}</span>
      <button @click="clearFile" class="clear-btn">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'fileLoaded', content: string, fileName: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref('');

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    readFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt'))) {
    readFile(file);
  }
};

const readFile = (file: File) => {
  fileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    emit('fileLoaded', content, file.name);
  };
  reader.readAsText(file);
};

const clearFile = () => {
  fileName.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>

<style scoped>
.markdown-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed rgba(52, 152, 219, 0.5);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: rgba(52, 152, 219, 0.05);
}

.upload-area:hover {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.1);
}

.upload-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.upload-area h3 {
  margin: 0 0 10px 0;
  color: #3498db;
  font-size: 20px;
}

.upload-area p {
  margin: 5px 0;
  color: #95a5a6;
  font-size: 14px;
}

.hint {
  font-size: 12px !important;
  font-style: italic;
}

.file-info {
  margin-top: 15px;
  padding: 12px;
  background-color: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.3);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  color: #2ecc71;
  font-weight: 500;
}

.clear-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  line-height: 1;
}

.clear-btn:hover {
  color: #c0392b;
}
</style>
