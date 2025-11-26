<template>
  <div class="plate-stat">
    <h4>板块数据统计</h4>
    <div class="stat-item">总区域数: <span>{{ stat?.total ?? '-' }}</span></div>
    <div class="stat-item">一级板块: <span>{{ stat?.level1 ?? '-' }}</span></div>
    <div class="stat-item">二级板块: <span>{{ stat?.level2 ?? '-' }}</span></div>
    <div class="stat-item">三级板块: <span>{{ stat?.level3 ?? '-' }}</span></div>
    
    <!-- 新增：一级板块详细信息 -->
    <div v-if="level1Details.length > 0" class="level1-details">
      <h5>一级板块详细信息 ({{ level1Details.length }}个)</h5>
      <div class="plate-list">
        <div v-for="(plate, index) in level1Details" :key="index" class="plate-item">
          <div class="plate-name">{{ plate.properties?.name || '未知名称' }}</div>
          <div class="plate-info">
            <span>代码: {{ plate.properties?.code || 'N/A' }}</span>
            <span>级别: {{ plate.properties?.level || 'N/A' }}</span>
            <span>面积: {{ plate.properties?.area || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <button @click="refresh">刷新统计</button>
    <button @click="loadLevel1Details" class="load-details-btn">加载一级板块详情</button>
    <div class="stat-status" v-if="statMsg">{{ statMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { plateRegionApi } from '../api/plateRegionApi';

const stat = ref<{total:number,level1:number,level2:number,level3:number}|null>(null);
const statMsg = ref('');
const level1Details = ref<any[]>([]);

async function refresh() {
  statMsg.value = '正在获取统计...';
  try {
    const res = await plateRegionApi.getStatistics();
    stat.value = res.data || null;
    statMsg.value = '';
  } catch (e: any) {
    stat.value = null;
    statMsg.value = '获取统计失败：' + (e.message || '未知错误') + (e.detail ? ('，' + e.detail) : '');
  }
}

async function loadLevel1Details() {
  statMsg.value = '正在加载一级板块详情...';
  try {
    const geoJson = await plateRegionApi.getGeoJsonByLevel(1);
    level1Details.value = geoJson.features || [];
    statMsg.value = `成功加载${level1Details.value.length}个一级板块详情`;
  } catch (e: any) {
    statMsg.value = '加载一级板块详情失败：' + (e.message || '未知错误');
    level1Details.value = [];
  }
}

onMounted(refresh);
</script>

<style scoped>
.plate-stat { 
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}
.plate-stat::-webkit-scrollbar {
  width: 6px;
}
.plate-stat::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.plate-stat::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.plate-stat::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
.plate-stat h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(64, 158, 255, 0.3);
}
.stat-item { 
  margin-bottom: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}
.stat-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}
.stat-item span {
  font-weight: 600;
  color: #409eff;
  font-size: 18px;
}
button { 
  margin-top: 12px; 
  margin-right: 12px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
}
button:active {
  transform: translateY(0);
}
.load-details-btn {
  background: linear-gradient(135deg, #67c23a 0%, #52a832 100%);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}
.load-details-btn:hover {
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.5);
}
.stat-status { 
  color: #67c23a; 
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(103, 194, 58, 0.1);
  border-left: 4px solid #67c23a;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
}
.level1-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid rgba(64, 158, 255, 0.3);
}
.level1-details h5 {
  color: #fff;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}
.plate-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}
.plate-list::-webkit-scrollbar {
  width: 6px;
}
.plate-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.plate-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.plate-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
.plate-item {
  background: rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
}
.plate-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}
.plate-name {
  color: #fff;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 15px;
}
.plate-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: #ccc;
}
.plate-info span {
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.3s ease;
}
.plate-info span:hover {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}
</style> 