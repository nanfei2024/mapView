<template>
  <div class="plate-upload">
    <h4>板块数据上传</h4>
    <div class="upload-section">
      <input type="file" multiple @change="handleFileChange" />
      <select v-model="selectedLevel">
        <option :value="1">一级板块</option>
        <option :value="2">二级板块</option>
        <option :value="3">三级板块</option>
      </select>
      <button @click="uploadFiles" :disabled="uploading">上传</button>
      <button @click="clearLevel" :disabled="uploading">清空本级</button>
      <button @click="clearAll" :disabled="uploading">清空全部</button>
    </div>
    <div class="upload-status" v-if="uploadStatus">{{ uploadStatus }}</div>
    <div class="import-status" v-if="importStatus">
      <div>导入状态：总数{{importStatus.total}}，一级{{importStatus.level1}}，二级{{importStatus.level2}}，三级{{importStatus.level3}}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { plateRegionApi } from '../api/plateRegionApi';
const props = defineProps<{ map: any }>();
const files = ref<File[]>([]);
const selectedLevel = ref(1);
const uploadStatus = ref('');
const uploading = ref(false);
const importStatus = ref<any>(null);
function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) files.value = Array.from(input.files);
}
async function uploadFiles() {
  if (!files.value.length) {
    uploadStatus.value = '请选择文件';
    return;
  }
  uploading.value = true;
  uploadStatus.value = '上传中...';
  try {
    let res;
    if (files.value.length === 1) {
      res = await plateRegionApi.importSingle(files.value[0], selectedLevel.value);
    } else {
      const levelSettings = Object.fromEntries(files.value.map(f => [f.name, selectedLevel.value]));
      res = await plateRegionApi.importBatch(files.value, levelSettings);
    }
    uploadStatus.value = res.message || '上传成功';
    files.value = [];
    await refreshImportStatus();
  } catch (e: any) {
    uploadStatus.value = '上传失败：' + (e.message || '未知错误') + (e.detail ? ('，' + e.detail) : '');
  } finally {
    uploading.value = false;
  }
}
async function clearLevel() {
  uploading.value = true;
  try {
    const res = await plateRegionApi.clearLevel(selectedLevel.value);
    uploadStatus.value = res.message || '本级数据已清空';
    await refreshImportStatus();
  } catch (e: any) {
    uploadStatus.value = '清空失败：' + (e.message || '未知错误') + (e.detail ? ('，' + e.detail) : '');
  } finally {
    uploading.value = false;
  }
}
async function clearAll() {
  uploading.value = true;
  try {
    const res = await plateRegionApi.clearAll();
    uploadStatus.value = res.message || '全部数据已清空';
    await refreshImportStatus();
  } catch (e: any) {
    uploadStatus.value = '清空失败：' + (e.message || '未知错误') + (e.detail ? ('，' + e.detail) : '');
  } finally {
    uploading.value = false;
  }
}
async function refreshImportStatus() {
  try {
    const res = await plateRegionApi.getImportStatus();
    importStatus.value = res.data;
  } catch (e: any) {
    importStatus.value = null;
    uploadStatus.value = '获取导入状态失败：' + (e.message || '未知错误');
  }
}
onMounted(refreshImportStatus);
</script>
<style scoped>
.plate-upload { 
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
.plate-upload h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(64, 158, 255, 0.3);
}
.upload-section { 
  display: flex; 
  gap: 12px; 
  align-items: center; 
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.upload-section input[type="file"] {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.upload-section input[type="file"]:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(64, 158, 255, 0.5);
}
.upload-section input[type="file"]::file-selector-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 12px;
  transition: all 0.3s ease;
}
.upload-section input[type="file"]::file-selector-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}
.upload-section select {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}
.upload-section select:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(64, 158, 255, 0.5);
}
.upload-section select option {
  background: #2c3e50;
  color: #fff;
}
.upload-section button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}
.upload-section button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
}
.upload-section button:active:not(:disabled) {
  transform: translateY(0);
}
.upload-section button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.upload-status { 
  color: #67c23a; 
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(103, 194, 58, 0.1);
  border-left: 4px solid #67c23a;
  border-radius: 6px;
  font-size: 14px;
}
.import-status { 
  color: #409eff; 
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(64, 158, 255, 0.1);
  border-left: 4px solid #409eff;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
}
</style> 