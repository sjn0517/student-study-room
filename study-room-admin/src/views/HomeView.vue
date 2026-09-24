<template>
  <div class="home-page">
    <div class="hero-section">
      <h1>欢迎来到自习室预约系统</h1>
      高效、便捷的自习室管理平台
    </div>

    

    <div class="quick-actions">
      <h3>快捷操作</h3>
      <div class="action-buttons">
        <router-link to="/booking" class="action-btn primary">
          <i class="fas fa-plus"></i>
          <span>预约座位</span>
        </router-link>
        <button class="action-btn secondary" @click="refreshData">
          <i class="fas fa-sync-alt"></i>
          <span>刷新数据</span>
        </button>
        <router-link to="/admin" class="action-btn success">
          <i class="fas fa-cog"></i>
          <span>后台管理</span>
        </router-link>
      </div>
    </div>

    <div class="recent-bookings">
      <h3>最新预约</h3>
      <!-- 确保 el-table 的 :data 绑定的是最新的数组 -->
      <el-table :data="bookingStore.getAllBookings.slice(0, 5)" style="width: 100%">
        <el-table-column prop="seatNumber" label="座位号" width="100" />
        <el-table-column prop="area" label="区域" width="100" />
        <el-table-column prop="userName" label="预约人" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="预约时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBookingStore } from '@/stores/useBookingStore'
import { ElMessage } from 'element-plus'

const bookingStore = useBookingStore()

// 刷新数据方法 —— 真正调用 Store 从后端重新拉取最新数据
const refreshData = async () => {
  try {
    await bookingStore.initializeData()
    ElMessage.success('数据已刷新')
  } catch {
    ElMessage.error('刷新失败，请检查服务是否运行')
  }
}

// 状态显示相关方法
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger',
    completed: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成'
  }
  return texts[status] || status
}

onMounted(async () => {
  // 页面加载时初始化所有数据，确保从后端获取最新状态
  try {
    await bookingStore.initializeData()
  } catch {
    ElMessage.error('加载数据失败，请检查服务是否运行')
  }
})
</script>

<style scoped>
/* 这里放你原来的 CSS 样式，完全不用动 */
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #8493d4 );
  border-radius: 12px;
  color: white;
}

.hero-section h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.hero-section p {
  font-size: 1.2rem;
  opacity: 0.9;
}


.quick-actions {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.quick-acts h3 {
  margin: 0 0 20ionpx 0;
  color: #262626;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  font-size: 16px;
}

.action-btn.primary {
  background: #1890ff;
  color: white;
}

.action-btn.primary:hover {
  background: #40a9ff;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #262626;
  border: 1px solid #d9d9d9;
}

.action-btn.secondary:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.action-btn.success {
  background: #52c41a;
  color: white;
}

.action-btn.success:hover {
  background: #73d13d;
}

.recent-bookings {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>