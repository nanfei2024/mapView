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
.plate-upload { padding: 12px; }
.upload-section { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.upload-status { color: #67c23a; margin-top: 8px; }
.import-status { color: #409eff; margin-top: 8px; font-size: 14px; }
</style> 