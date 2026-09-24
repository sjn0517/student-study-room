<template>
  <div class="booking-page">
    <div class="page-header">
      <h1><i class="el-icon-date"></i> 预约自习室</h1>
      <p>请选择座位、时间并填写预约信息</p>
    </div>

    <div class="booking-container">
      <!-- 左侧：座位选择区 -->
      <div class="seat-selection">
        <div class="section-header">
          <h2><i class="el-icon-location-information"></i> 选择座位</h2>
          <div class="legend">
            <span class="legend-item available"></span> 可用
            <span class="legend-item occupied"></span> 占用
            <span class="legend-item selected"></span> 选中
            <span class="legend-item maintenance"></span> 维护
          </div>
        </div>

        <!-- 区域筛选 -->
        <div class="area-filters">
          <el-radio-group v-model="selectedArea">
            <el-radio-button label="all">全部区域</el-radio-button>
            <el-radio-button label="靠窗区">靠窗区</el-radio-button>
            <el-radio-button label="中间区">中间区</el-radio-button>
            <el-radio-button label="后排区">后排区</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 座位网格 -->
        <div class="seats-grid" v-loading="bookingStore.loading.seats">
          <div
            v-for="seat in filteredSeats"
            :key="seat.id"
            class="seat-item"
            :class="[
              seat.status,
              { selected: selectedSeat?.id === seat.id }
            ]"
            @click="selectSeat(seat)"
          >
            <div class="seat-number">{{ seat.number }}</div>
            <div class="seat-area">{{ seat.area }}</div>
            <div class="seat-status">
              <span v-if="seat.status === 'occupied'">占用中</span>
              <span v-else-if="seat.status === 'maintenance'">维修中</span>
              <span v-else>可用</span>
            </div>
            <div v-if="seat.features && seat.features.length > 0" class="seat-features">
              <el-tag
                v-for="feature in seat.features"
                :key="feature"
                size="small"
                type="info"
              >
                {{ feature }}
              </el-tag>
            </div>
          </div>
          <div v-if="filteredSeats.length === 0" class="empty-seats">
            <el-empty description="暂无座位数据" />
          </div>
        </div>
      </div>

      <!-- 右侧：预约表单 -->
      <div class="booking-form-section">
        <div class="section-header">
          <h2><i class="el-icon-edit"></i> 预约信息</h2>
        </div>

        <el-form
          ref="bookingFormRef"
          :model="bookingForm"
          :rules="bookingRules"
          label-width="100px"
          class="booking-form"
        >
          <!-- 座位信息 -->
          <el-form-item label="选择座位" prop="seatNumber">
            <el-input
              v-model="bookingForm.seatNumber"
              placeholder="点击左侧座位图选择"
              readonly
              :class="{ 'selected-seat': bookingForm.seatNumber }"
            >
              <template #append>
                <el-button
                  v-if="bookingForm.seatNumber"
                  @click="clearSeat"
                  type="danger"
                  size="small"
                >
                  取消选择
                </el-button>
              </template>
            </el-input>
            <div v-if="selectedSeat" class="seat-details">
              <h4>座位详情：</h4>
              <p>座位号：{{ selectedSeat.number }}</p>
              <p>区域：{{ selectedSeat.area }}</p>
              <p>状态：{{ getSeatStatusText(selectedSeat.status) }}</p>
            </div>
          </el-form-item>

          <!-- 用户信息 -->
          <el-form-item label="预约人姓名" prop="userName">
            <el-input
              v-model="bookingForm.userName"
              placeholder="请输入您的姓名"
              clearable
            />
          </el-form-item>

          <el-form-item label="学号/工号" prop="userId">
            <el-input
              v-model="bookingForm.userId"
              placeholder="请输入学号或工号"
              clearable
            />
          </el-form-item>

          <el-form-item label="联系电话" prop="phone">
            <el-input
              v-model="bookingForm.phone"
              placeholder="请输入手机号"
              clearable
            />
          </el-form-item>

          <!-- 预约时间 -->
          <el-form-item label="预约日期" prop="date">
            <el-date-picker
              v-model="bookingForm.date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              :disabled-date="disabledDate"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item label="时间范围" prop="startTime">
            <el-time-select
              v-model="bookingForm.startTime"
              placeholder="开始时间"
              :start="'08:00'"
              :step="'00:30'"
              :end="'22:00'"
              style="width: 48%; margin-right: 4%"
            />
            <el-time-select
              v-model="bookingForm.endTime"
              placeholder="结束时间"
              :start="bookingForm.startTime || '08:00'"
              :step="'00:30'"
              :end="'23:00'"
              :min-time="bookingForm.startTime"
              style="width: 48%"
            />
          </el-form-item>

          <!-- 备注 -->
          <el-form-item label="备注" prop="note">
            <el-input
              v-model="bookingForm.note"
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
              @click="submitBooking"
              :loading="submitting"
              :disabled="!selectedSeat"
            >
              <i class="el-icon-check"></i> 提交预约
            </el-button>
            <el-button @click="resetForm">重置</el-button>
            <el-button @click="$router.push('/')">返回首页</el-button>
          </el-form-item>
        </el-form>

        <!-- 我的预约记录 -->
        <div v-if="userBookings.length > 0" class="booking-history">
          <h3><i class="el-icon-tickets"></i> 我的预约记录</h3>
          <el-table :data="userBookings" style="width: 100%" size="small">
            <el-table-column prop="seatNumber" label="座位号" width="80" />
            <el-table-column prop="date" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
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
                  @click="cancelBooking(row.id)"
                >
                  取消
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 预约成功对话框 -->
    <el-dialog
      v-model="showSuccessDialog"
      title="预约成功"
      width="400px"
      :show-close="false"
    >
      <div class="success-dialog">
        <el-icon class="success-icon" :size="60" color="#67c23a">
          <SuccessFilled />
        </el-icon>
        <p style="margin: 20px 0; font-size: 16px;">预约提交成功！</p>
        <div class="success-details">
          <p><strong>座位号：</strong> {{ bookingResult?.seatNumber }}</p>
          <p><strong>预约人：</strong> {{ bookingResult?.userName }}</p>
          <p><strong>预约时间：</strong> {{ bookingResult?.date }} {{ bookingResult?.startTime }} - {{ bookingResult?.endTime }}</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleSuccessConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/useBookingStore'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { SuccessFilled } from '@element-plus/icons-vue'

const router = useRouter()
const bookingStore = useBookingStore()
const bookingFormRef = ref<FormInstance>()

// 响应式数据
const selectedArea = ref('all')
const selectedSeat = ref<any>(null)
const submitting = ref(false)
const showSuccessDialog = ref(false)
const bookingResult = ref<any>(null)

// 表单数据
const bookingForm = reactive({
  seatNumber: '',
  userName: '',
  userId: '',
  phone: '',
  date: '',
  startTime: '',
  endTime: '',
  note: ''
})

// 表单验证规则
const bookingRules = {
  seatNumber: [
    { required: true, message: '请选择座位', trigger: 'blur' }
  ],
  userName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在2-20个字符', trigger: 'blur' }
  ],
  userId: [
    { required: true, message: '请输入学号/工号', trigger: 'blur' },
    { pattern: /^[0-9A-Za-z]{4,20}$/, message: '请输入4-20位数字或字母', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择预约日期', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
}

// 计算属性：按区域过滤后的座位
const filteredSeats = computed(() => {
  const allSeats = bookingStore.seats || []
  if (selectedArea.value === 'all') return allSeats
  return allSeats.filter(seat => seat.area === selectedArea.value)
})

// 用户的预约记录（按学号筛选）
const userBookings = computed(() => {
  if (!bookingStore.bookings || !bookingForm.userId) return []
  return bookingStore.bookings
    .filter(booking => booking.userId === bookingForm.userId)
    .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
    .slice(0, 5) // 只显示最近5条
})

// 选择座位
const selectSeat = (seat: any) => {
  if (seat.status !== 'idle' && seat.status !== 'available') {
    ElMessage.warning('该座位不可用')
    return
  }
  selectedSeat.value = seat
  bookingForm.seatNumber = seat.number
}

// 清除座位选择
const clearSeat = () => {
  selectedSeat.value = null
  bookingForm.seatNumber = ''
}

const getSeatStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    idle: '空闲',
    available: '可用',
    occupied: '占用中',
    maintenance: '维修中'
  }
  return statusMap[status] || status
}

const disabledDate = (time: Date) => {
  // 禁止选择今天之前的日期
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

const validateBookingTime = () => {
  if (!bookingForm.startTime || !bookingForm.endTime) {
    ElMessage.error('请选择开始和结束时间')
    return false
  }
  const start = parseInt(bookingForm.startTime.replace(':', ''))
  const end = parseInt(bookingForm.endTime.replace(':', ''))

  if (end <= start) {
    ElMessage.error('结束时间必须晚于开始时间')
    return false
  }
  if (end - start < 100) {
    ElMessage.error('预约时长至少1小时')
    return false
  }
  if (end - start > 600) {
    ElMessage.error('单次预约最多6小时')
    return false
  }
  return true
}

// 提交预约 —— 真正调用 API 写入 db.json，刷新后数据不会丢失
const submitBooking = async () => {
  if (!selectedSeat.value) {
    ElMessage.error('请先选择座位')
    return
  }

  try {
    await bookingFormRef.value?.validate()
  } catch {
    ElMessage.error('请检查表单填写是否正确')
    return
  }

  if (!validateBookingTime()) return

  submitting.value = true
  try {
    // 1. 调用 API 创建预约，数据写入 db.json（持久化）
    const newBooking = await bookingStore.addBooking({
      seatNumber: bookingForm.seatNumber,
      area: selectedSeat.value.area,
      userName: bookingForm.userName,
      userId: bookingForm.userId,
      phone: bookingForm.phone,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      note: bookingForm.note,
      status: 'pending'
    })

    // 2. 同步更新座位状态（占用）—— 写入 db.json
    await bookingStore.updateSeat(selectedSeat.value.id, {
      status: 'occupied',
      currentUser: bookingForm.userName
    })

    // 3. 显示成功信息
    bookingResult.value = newBooking
    showSuccessDialog.value = true

    // 4. 重置表单
    resetForm()

  } catch (error) {
    console.error('预约失败:', error)
    ElMessage.error('预约失败，请确认后端服务已启动（npm run server）')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  bookingFormRef.value?.resetFields()
  selectedSeat.value = null
  bookingForm.seatNumber = ''
  bookingForm.userName = ''
  bookingForm.userId = ''
  bookingForm.phone = ''
  bookingForm.date = ''
  bookingForm.startTime = ''
  bookingForm.endTime = ''
  bookingForm.note = ''
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const getBookingStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger',
    completed: 'info'
  }
  return typeMap[status] || 'info'
}

const getBookingStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成'
  }
  return textMap[status] || status
}

// 取消预约 —— 真正调用 API 更新状态，同步释放座位
const cancelBooking = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '保留预约'
    })

    // 找到当前预约
    const booking = bookingStore.bookings.find(b => b.id === id)
    if (!booking) return

    // 1. 调用 API 更新预约状态为已取消（持久化）
    await bookingStore.updateBooking(id, { status: 'cancelled' })

    // 2. 同步释放座位（若该座位正是因此预约而占用）
    const seat = bookingStore.seats.find(s => s.number === booking.seatNumber)
    if (seat && seat.status === 'occupied') {
      await bookingStore.updateSeat(seat.id, {
        status: 'idle',
        currentUser: ''
      })
    }

    ElMessage.success('预约已取消')
  } catch {
    // 用户点击"保留预约"，不做处理
  }
}

const handleSuccessConfirm = () => {
  showSuccessDialog.value = false
  router.push('/')
}

// 页面初始化：从后端加载座位和预约数据
onMounted(async () => {
  try {
    await Promise.all([
      bookingStore.fetchSeats(),
      bookingStore.fetchBookings()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.warning('加载数据失败，请确认后端服务已启动（npm run server）')
  }
})
</script>

<style scoped>
.booking-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.page-header h1 {
  color: #303133;
  font-size: 28px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.page-header p {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

.booking-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  margin-bottom: 30px;
}

@media (max-width: 1200px) {
  .booking-container {
    grid-template-columns: 1fr;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h2 {
  font-size: 20px;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.legend-item {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 5px;
  vertical-align: middle;
}

.legend-item.available {
  background-color: #67c23a;
}

.legend-item.occupied {
  background-color: #f56c6c;
}

.legend-item.selected {
  background-color: #409eff;
  border: 2px solid #409eff;
}

.legend-item.maintenance {
  background-color: #e6a23c;
}

.area-filters {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.seats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 300px;
}

.seat-item {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.seat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.seat-item.occupied {
  border-color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
  cursor: not-allowed;
}

.seat-item.occupied:hover {
  transform: none;
  box-shadow: none;
  border-color: #f56c6c;
}

.seat-item.maintenance {
  border-color: #e6a23c;
  background-color: rgba(230, 162, 60, 0.1);
  cursor: not-allowed;
}

.seat-item.selected {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  border-width: 3px;
}

.seat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.seat-area {
  font-size: 12px;
  color: #909399;
  background: rgba(144, 147, 153, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 8px;
  display: inline-block;
}

.seat-status {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.seat-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-top: 5px;
}

.empty-seats {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

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