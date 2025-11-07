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
  padding: 12px; 
  max-height: 400px;
  overflow-y: auto;
}

.stat-item { 
  margin-bottom: 8px; 
  color: #fff; 
}

button { 
  margin-top: 8px; 
  margin-right: 8px;
  padding: 6px 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.load-details-btn {
  background: #67c23a;
}

.stat-status { 
  color: #f56c6c; 
  margin-top: 8px; 
  font-size: 14px; 
}

.level1-details {
  margin-top: 16px;
  border-top: 1px solid #444;
  padding-top: 12px;
}

.level1-details h5 {
  color: #fff;
  margin-bottom: 12px;
  font-size: 14px;
}

.plate-list {
  max-height: 200px;
  overflow-y: auto;
}

.plate-item {
  background: rgba(255,255,255,0.1);
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.plate-name {
  color: #fff;
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 13px;
}

.plate-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #ccc;
}

.plate-info span {
  background: rgba(0,0,0,0.3);
  padding: 2px 6px;
  border-radius: 3px;
}
</style> 