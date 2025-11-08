<template>
  <div class="sidebar-plate-manager-inner">
    <button class="close-btn" @click="$emit('close')">×</button>
    <div class="tab-bar">
      <button :class="{active: tab==='upload'}" @click="tab='upload'">上传板块数据</button>
      <button :class="{active: tab==='list'}" @click="tab='list'">板块数据展示</button>
      <button :class="{active: tab==='stat'}" @click="tab='stat'">统计信息</button>
    </div>
    <div class="tab-content">
      <PlateUpload v-if="tab==='upload'" :map="map" />
      <PlateList v-if="tab==='list'" :map="map" />
      <PlateStat v-if="tab==='stat'" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import PlateUpload from './PlateUpload.vue';
import PlateList from './PlateList.vue';
import PlateStat from './PlateStat.vue';
const props = defineProps<{ map: any }>();
const tab = ref('upload');
</script>
<style scoped>
.sidebar-plate-manager-inner {
  width: 100%; height: 100%; position: relative;
  display: flex; flex-direction: column;
}
.close-btn {
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; color: #fff;
  font-size: 26px; cursor: pointer; z-index: 10;
}
.tab-bar {
  display: flex; gap: 8px; margin: 48px 0 12px 0; padding: 0 16px;
}
.tab-bar button {
  background: #34495e; color: #fff; border: none; border-radius: 4px;
  padding: 8px 18px; font-size: 15px; cursor: pointer;
  transition: background 0.2s;
}
.tab-bar button.active, .tab-bar button:hover {
  background: #409eff; color: #fff;
}
.tab-content {
  flex: 1; padding: 0 16px;
  color: #fff; font-size: 15px;
}
</style> 