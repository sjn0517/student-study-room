<template>
  <div class="admin-page">
    <!-- 管理面板标题 -->
    <PageHeader
      title="自习室管理系统"
      subtitle="管理员控制面板 - 管理预约、座位、违规和通知"
      icon="el-icon-s-management"
    />

    <!-- 管理导航菜单 -->
    <div class="admin-nav">
      <el-menu
        :default-active="activeTab"
        mode="horizontal"
        @select="handleTabSelect"
        class="admin-menu"
      >
        <el-menu-item index="bookings">
          <i class="el-icon-tickets"></i>
          预约管理
        </el-menu-item>
        <el-menu-item index="seats">
          <i class="el-icon-office-building"></i>
          座位管理
        </el-menu-item>
        <el-menu-item index="violations">
          <i class="el-icon-warning"></i>
          违规处理
        </el-menu-item>
        <el-menu-item index="notices">
          <i class="el-icon-chat-dot-square"></i>
          系统通知
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 管理内容区域：每个标签页是一个独立面板组件 -->
    <div class="admin-content">
      <BookingsPanel v-if="activeTab === 'bookings'" />
      <SeatsPanel v-else-if="activeTab === 'seats'" />
      <ViolationsPanel v-else-if="activeTab === 'violations'" />
      <NoticesPanel v-else-if="activeTab === 'notices'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useBookingStore } from '@/stores/useBookingStore'
import PageHeader from '@/components/common/PageHeader.vue'
import BookingsPanel from '@/components/admin/BookingsPanel.vue'
import SeatsPanel from '@/components/admin/SeatsPanel.vue'
import ViolationsPanel from '@/components/admin/ViolationsPanel.vue'
import NoticesPanel from '@/components/admin/NoticesPanel.vue'

/**
 * AdminView 管理后台入口
 *
 * 这里只保留"标题 + 标签导航 + 面板切换 + 初始数据加载"这部分编排逻辑，
 * 具体业务（预约审批、座位管理、违规处理、通知发布）分别由 views/admin 下的
 * 四个面板组件承担。
 */
const bookingStore = useBookingStore()

const activeTab = ref('bookings')

const handleTabSelect = (key: string) => {
  activeTab.value = key
}

onMounted(async () => {
  try {
    await Promise.all([
      bookingStore.fetchBookings(),
      bookingStore.fetchSeats(),
      bookingStore.fetchViolations(),
      bookingStore.fetchNotices()
    ])
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error?.message || '加载初始数据失败')
  }
})
</script>

<style scoped>
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.admin-nav {
  margin-bottom: 30px;
}

.admin-menu {
  border-bottom: 1px solid #e4e7ed;
}

.admin-content {
  min-height: 500px;
}
</style>
