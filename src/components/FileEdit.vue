<template>
  <div class="file-edit">
    <h2>编辑文件</h2>
    <el-form :model="file" label-width="120px" class="file-edit-form">
      <el-form-item label="章节">
        <el-input v-model="file.property" placeholder="请输入章节属性"></el-input>
      </el-form-item>
      <el-form-item label="文件类型">
        <el-select v-model="file.file_type" placeholder="请选择文件类型">
          <el-option label="文章" value="article"></el-option>
          <el-option label="图片" value="image"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="文件路径">
        <el-input v-model="file.file_path" placeholder="请输入文件路径"></el-input>
      </el-form-item>
      <el-form-item v-if="file.file_type === 'article'" label="文件详细内容">
        <el-input
          type="textarea"
          v-model="file.details"
          placeholder="请输入文章内容或概述"
          rows="6"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="updateFile">保存</el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  setup() {
    const file = ref<any>({
      id: null,
      property: '',
      file_type: '',
      file_path: '',
      details: '', // 用于保存文件的详细内容（如文章内容或概述）
    });

    const originalFile = ref<any>({}); // 用于存储原始数据，进行比较

    const route = useRoute();
    const router = useRouter();

    // 获取文件详情
    const fetchFileDetails = async () => {
      const fileId = Number(route.params.id);  // 将字符串转换为数值
      try {
        const response = await fetch(`http://localhost:8080/api/files/details/${fileId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched file details:', data); // 调试日志，检查获取的数据
          file.value = data; // 保存文件详情
          originalFile.value = { ...data }; // 缓存原始数据
        } else {
          const data = await response.json();
          alert(data.message || '获取文件详情失败');
        }
      } catch (error) {
        console.error('获取文件详情失败', error);
        alert('请求文件详情时发生错误');
      }
    };

    // 更新文件信息，只有发生变化时才更新
    const updateFile = async () => {
  if (!file.value.property || !file.value.file_type || !file.value.file_path) {
    alert('请填写所有字段');
    return;
  }

  const fileId = file.value.id; // 获取当前编辑的文件 ID
  if (!fileId) {
    alert('文件 ID 无效');
    return;
  }

  const updates: any = {
    fileType: file.value.file_type, // 这里确保使用与后端 SQL 参数一致的字段名
    property: file.value.property,
    filePath: file.value.file_path,
    details: file.value.details,
  };

  // 检查文件是否发生变化，如果没有变化就不更新
  if (Object.keys(updates).length === 0) {
    alert('没有任何修改');
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/api/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      alert('文件更新成功');
      router.push('/'); // 更新成功后返回首页
    } else {
      const data = await response.json();
      alert(data.message || '更新文件失败');
    }
  } catch (error) {
    console.error('更新文件失败', error);
    alert('请求更新文件时发生错误');
  }
};


    // 返回上一页
    const goBack = () => {
      router.push('/filepagination');
    };

    // 在组件挂载时加载文件详情
    onMounted(fetchFileDetails);

    return {
      file,
      updateFile,
      goBack,
    };
  },
});
</script>

<style scoped>
.file-edit {
  padding: 20px;
}

.file-edit-form {
  max-width: 600px;
}
</style>
