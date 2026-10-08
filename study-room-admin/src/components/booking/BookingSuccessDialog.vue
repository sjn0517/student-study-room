<template>
  <el-dialog
    :model-value="modelValue"
    title="预约成功"
    width="400px"
    :show-close="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="success-dialog">
      <el-icon class="success-icon" :size="60" color="#67c23a">
        <SuccessFilled />
      </el-icon>
      <p style="margin: 20px 0; font-size: 16px;">预约提交成功！</p>
      <div class="success-details">
        <p><strong>座位号：</strong> {{ booking?.seatNumber }}</p>
        <p><strong>预约人：</strong> {{ booking?.userName }}</p>
        <p>
          <strong>预约时间：</strong>
          {{ booking?.date }} {{ booking?.startTime }} - {{ booking?.endTime }}
        </p>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="emit('confirm')">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { SuccessFilled } from '@element-plus/icons-vue'

/**
 * BookingSuccessDialog 预约成功提示框
 */
defineProps<{
  modelValue: boolean
  booking: Record<string, any> | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()
</script>

<style scoped>
.success-dialog {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  margin-bottom: 20px;
}

.success-details {
  text-align: left;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
}

.success-details p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}
</style>
