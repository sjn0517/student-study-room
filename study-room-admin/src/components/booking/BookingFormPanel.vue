<template>
  <div class="booking-form-section">
    <SectionHeader title="预约信息" icon="el-icon-edit" />

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="booking-form"
    >
      <!-- 座位信息 -->
      <el-form-item label="选择座位" prop="seatNumber">
        <el-input
          v-model="form.seatNumber"
          placeholder="点击左侧座位图选择"
          readonly
          :class="{ 'selected-seat': form.seatNumber }"
        >
          <template #append>
            <el-button
              v-if="form.seatNumber"
              type="danger"
              size="small"
              @click="emit('clear-seat')"
            >
              取消选择
            </el-button>
          </template>
        </el-input>
        <div v-if="selectedSeat" class="seat-details">
          <h4>座位详情：</h4>
          <p>座位号：{{ selectedSeat.number }}</p>
          <p>区域：{{ selectedSeat.area }}</p>
          <p>状态：{{ SEAT_STATUS_TEXT[selectedSeat.status] || selectedSeat.status }}</p>
        </div>
      </el-form-item>

      <!-- 用户信息 -->
      <el-form-item label="预约人姓名" prop="userName">
        <el-input v-model="form.userName" placeholder="请输入您的姓名" clearable />
      </el-form-item>

      <el-form-item label="学号/工号" prop="userId">
        <el-input v-model="form.userId" placeholder="请输入学号或工号" clearable />
      </el-form-item>

      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号" clearable />
      </el-form-item>

      <!-- 预约时间 -->
      <el-form-item label="预约日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
          :disabled-date="disabledDate"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="时间范围" prop="startTime">
        <el-time-select
          v-model="form.startTime"
          placeholder="开始时间"
          :start="'08:00'"
          :step="'00:30'"
          :end="'22:00'"
          style="width: 48%; margin-right: 4%"
        />
        <el-time-select
          v-model="form.endTime"
          placeholder="结束时间"
          :start="form.startTime || '08:00'"
          :step="'00:30'"
          :end="'23:00'"
          :min-time="form.startTime"
          style="width: 48%"
        />
      </el-form-item>

      <!-- 备注 -->
      <el-form-item label="备注" prop="note">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="可填写特殊需求（如：需要电源插座、小组讨论等）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- 提交按钮 -->
      <el-form-item>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!selectedSeat"
          @click="emit('submit')"
        >
          <i class="el-icon-check"></i> 提交预约
        </el-button>
        <el-button @click="emit('reset')">重置</el-button>
        <el-button @click="emit('back')">返回首页</el-button>
      </el-form-item>
    </el-form>

    <!-- 我的预约记录 -->
    <MyBookingsTable
      v-if="userBookings.length > 0"
      :bookings="userBookings"
      @cancel="emit('cancel-booking', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import SectionHeader from '@/components/booking/SectionHeader.vue'
import MyBookingsTable from '@/components/booking/MyBookingsTable.vue'

/**
 * BookingFormPanel 预约信息填写区
 * 负责表单界面与校验，提交 / 重置 / 取消选座等动作交给父组件（BookingView）处理。
 */
defineProps<{
  /** 表单数据对象（由父组件持有，保证父子状态一致） */
  form: Record<string, any>
  /** 表单校验规则 */
  rules: Record<string, any>
  /** 当前选中的座位 */
  selectedSeat: any
  /** 提交中状态 */
  submitting?: boolean
  /** 当前用户的预约记录 */
  userBookings: any[]
}>()

const emit = defineEmits<{
  submit: []
  reset: []
  'clear-seat': []
  'cancel-booking': [id: number]
  back: []
}>()

/** 座位状态文案（与预约页原有的展示口径保持一致） */
const SEAT_STATUS_TEXT: Record<string, string> = {
  idle: '空闲',
  available: '可用',
  occupied: '占用中',
  maintenance: '维修中'
}

const formRef = ref<FormInstance>()

const disabledDate = (time: Date) => {
  // 禁止选择今天之前的日期
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields()
})
</script>

<style scoped>
.booking-form-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.selected-seat {
  border-color: #409eff !important;
  background-color: rgba(64, 158, 255, 0.05) !important;
}

.seat-details {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 10px;
  border-left: 4px solid #409eff;
}

.seat-details h4 {
  color: #303133;
  margin: 0 0 10px 0;
  font-size: 16px;
}

.seat-details p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}

.booking-form {
  margin-top: 20px;
}
</style>
