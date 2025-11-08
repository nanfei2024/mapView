<template>
  <div>
    <el-dropdown trigger="click">
      <el-button type="primary">
        功能菜单 <i class="el-icon-arrow-down"></i>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item @click="handleClick('选项1')">选项1</el-dropdown-item>
        <el-dropdown-item @click="handleClick('选项2')">选项2</el-dropdown-item>
        <el-dropdown-item @click="handleClick('选项3')">选项3</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script setup>
const handleClick = (item) => {
  console.log(`点击了 ${item}`);
};
</script>

<style scoped>
/* 确保菜单项正确显示 */
.el-dropdown-menu {
  display: block !important; /* 强制显示为块级元素 */
}

.el-dropdown-item {
  padding: 10px; /* 增加选项间距 */
}
</style>
