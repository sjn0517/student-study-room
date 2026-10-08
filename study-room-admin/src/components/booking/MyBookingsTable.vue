<template>
  <div class="booking-history">
    <h3><i class="el-icon-tickets"></i> 我的预约记录</h3>
    <el-table :data="bookings" style="width: 100%" size="small">
      <el-table-column prop="seatNumber" label="座位号" width="80" />
      <el-table-column prop="date" label="日期" width="120">
        <template #default="{ row }">
          {{ formatDateCN(row.date) }}
        </template>
      </el-table-column>
      <el-table-column label="时间" width="150">
        <template #default="{ row }">
          {{ row.startTime }} - {{ row.endTime }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getBookingStatusType(row.status)" size="small">
            {{ getBookingStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending' || row.status === 'confirmed'"
            type="danger"
            size="small"
            @click="emit('cancel', row.id)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { formatDateCN, getBookingStatusType, getBookingStatusText } from '@/utils/dict'

/**
 * MyBookingsTable 当前用户的预约记录表
 */
defineProps<{
  bookings: any[]
}>()

const emit = defineEmits<{
  cancel: [id: number]
}>()
</script>

<style scoped>
.booking-history {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.booking-history h3 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
