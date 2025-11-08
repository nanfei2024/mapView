<template>
  <div class="file-upload">
    <el-upload
      action="http://localhost:8080/api/upload/files" 
      :data="uploadData"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      multiple
      name="files"
    >
      <el-button type="primary">点击上传</el-button>
    </el-upload>
    <el-select v-model="fileType" placeholder="选择文件类型" style="margin-top: 10px;">
      <el-option label="文章" value="article"></el-option>
      <el-option label="图片" value="image"></el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { ElUpload, ElButton, ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  components: {
    ElUpload,
    ElButton,
    ElSelect,
    ElOption,
  },
  setup() {
    const fileType = ref('article');
    const uploadData = ref({ fileType });

    const handleUploadSuccess = (response: any) => {
      console.log('上传成功：', response);
    };

    const handleUploadError = (error: any) => {
      console.error('上传失败：', error);
    };

    return {
      fileType,
      uploadData,
      handleUploadSuccess,
      handleUploadError,
    };
  },
});
</script>

<style scoped>
.file-upload {
  padding: 20px;
  max-width: 600px;
  margin: 20px auto;
}

.el-upload {
  width: 100%;
}

.el-select {
  width: 100%;
  margin-top: 10px;
}
</style>
