<template>
  <el-dialog
    :model-value="modelValue"
    title="预约详情"
    width="600px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="booking" class="booking-details">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="座位号">{{ booking.seatNumber }}</el-descriptions-item>
        <el-descriptions-item label="区域">{{ booking.area }}</el-descriptions-item>
        <el-descriptions-item label="预约人">{{ booking.userName }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ booking.userId }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ booking.phone }}</el-descriptions-item>
        <el-descriptions-item label="预约日期">{{ formatDateCN(booking.date) }}</el-descriptions-item>
        <el-descriptions-item label="时间">
          {{ booking.startTime }} - {{ booking.endTime }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getBookingStatusType(booking.status)" size="small">
            {{ getBookingStatusText(booking.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTimeCN(booking.createdTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ booking.note || '无' }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  formatDateCN,
  formatDateTimeCN,
  getBookingStatusType,
  getBookingStatusText
} from '@/utils/dict'

/**
 * BookingDetailDialog 预约详情对话框
 */
defineProps<{
  modelValue: boolean
  booking: Record<string, any> | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.booking-details {
  padding: 10px 0;
}
</style>
