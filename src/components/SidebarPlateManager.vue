<template>
  <div class="sidebar-plate-manager-inner">
    <button class="close-btn" @click="$emit('close')">×</button>
    <div class="tab-bar">
      <button :class="{active: tab==='upload'}" @click="tab='upload'">上传板块数据</button>
      <button :class="{active: tab==='list'}" @click="tab='list'">板块数据展示</button>
      <button :class="{active: tab==='stat'}" @click="tab='stat'">统计信息</button>
      <button :class="{active: tab==='link'}" @click="tab='link'">板块书籍联动</button>
    </div>
    <div class="tab-content">
      <PlateUpload v-if="tab==='upload'" :map="map" />
      <PlateList v-if="tab==='list'" :map="map" />
      <PlateStat v-if="tab==='stat'" />
      <PlateBookLink v-if="tab==='link'" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import PlateUpload from './PlateUpload.vue';
import PlateList from './PlateList.vue';
import PlateStat from './PlateStat.vue';
import PlateBookLink from './PlateBookLink.vue';
const props = defineProps<{ map: any }>();
const tab = ref('upload');
</script>
<style scoped>
.sidebar-plate-manager-inner {
  width: 100%; 
  height: 100%; 
  position: relative;
  display: flex; 
  flex-direction: column;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
}
.close-btn {
  position: absolute; 
  top: 16px; 
  right: 16px;
  background: rgba(255, 255, 255, 0.1); 
  border: none; 
  color: #fff;
  font-size: 24px; 
  cursor: pointer; 
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}
.tab-bar {
  display: flex; 
  gap: 12px; 
  margin: 60px 20px 20px 20px; 
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
.tab-bar button {
  flex: 1;
  background: transparent; 
  color: rgba(255, 255, 255, 0.7); 
  border: none; 
  border-radius: 8px;
  padding: 12px 20px; 
  font-size: 15px; 
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.tab-bar button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}
.tab-bar button.active::before,
.tab-bar button:hover::before {
  opacity: 1;
}
.tab-bar button.active, 
.tab-bar button:hover {
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}
.tab-bar button.active {
  font-weight: 600;
}
.tab-content {
  flex: 1; 
  padding: 0 20px 20px 20px;
  color: #fff; 
  font-size: 15px;
  overflow-y: auto;
}
.tab-content::-webkit-scrollbar {
  width: 8px;
}
.tab-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
.tab-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: background 0.3s;
}
.tab-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style> 