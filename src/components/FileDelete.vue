<template>
    <div class="file-container">
      <h2>文件管理</h2>
      <ul>
        <li v-for="file in files" :key="file.id">
          {{ file.fileName }}
          <button @click="deleteFile(file.id)">删除</button>
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        files: [],  // 文件列表
      };
    },
    methods: {
      async deleteFile(fileId) {
        try {
          const response = await axios.delete(`/api/files/${fileId}`);
          alert(response.data.message);
          this.fetchFiles();  // 删除成功后刷新文件列表
        } catch (error) {
          console.error('文件删除失败', error);
          alert('文件删除失败');
        }
      },
      async fetchFiles() {
        // 获取文件列表，逻辑与分页查询类似
      },
    },
  };
  </script>
  