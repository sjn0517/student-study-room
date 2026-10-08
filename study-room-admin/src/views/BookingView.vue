<template>
  <div class="booking-page">
    <PageHeader
      title="预约自习室"
      subtitle="请选择座位、时间并填写预约信息"
      icon="el-icon-date"
    />

    <div class="booking-container">
      <!-- 左侧：座位选择区 -->
      <SeatSelector
        :seats="bookingStore.seats || []"
        :selected-seat="selectedSeat"
        :loading="bookingStore.loading.seats"
        @select="selectSeat"
      />

      <!-- 右侧：预约表单 -->
      <BookingFormPanel
        ref="bookingFormPanelRef"
        :form="bookingForm"
        :rules="bookingRules"
        :selected-seat="selectedSeat"
        :submitting="submitting"
        :user-bookings="userBookings"
        @submit="submitBooking"
        @reset="resetForm"
        @clear-seat="clearSeat"
        @cancel-booking="cancelBooking"
        @back="router.push('/')"
      />
    </div>

    <!-- 预约成功对话框 -->
    <BookingSuccessDialog
      v-model="showSuccessDialog"
      :booking="bookingResult"
      @confirm="handleSuccessConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/useBookingStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SeatSelector from '@/components/booking/SeatSelector.vue'
import BookingFormPanel from '@/components/booking/BookingFormPanel.vue'
import BookingSuccessDialog from '@/components/booking/BookingSuccessDialog.vue'

/**
 * BookingView 预约页
 *
 * 页面本身只负责状态编排（当前选中座位、表单数据、提交与取消流程），
 * 界面拆分为三个子组件：
 *   SeatSelector        左侧座位选择区
 *   BookingFormPanel    右侧预约表单 + 我的预约记录
 *   BookingSuccessDialog 预约成功提示框
 */
const router = useRouter()
const bookingStore = useBookingStore()

const bookingFormPanelRef = ref<InstanceType<typeof BookingFormPanel>>()

// ====================== 响应式数据 ======================
const selectedSeat = ref<any>(null)
const submitting = ref(false)
const showSuccessDialog = ref(false)
const bookingResult = ref<any>(null)

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

// ====================== 表单校验规则 ======================
const bookingRules = {
  seatNumber: [{ required: true, message: '请选择座位', trigger: 'blur' }],
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
  date: [{ required: true, message: '请选择预约日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

// ====================== 计算属性 ======================
/** 当前用户的预约记录（按学号筛选，只展示最近 5 条） */
const userBookings = computed(() => {
  if (!bookingStore.bookings || !bookingForm.userId) return []
  return bookingStore.bookings
    .filter(booking => booking.userId === bookingForm.userId)
    .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
    .slice(0, 5)
})

// ====================== 选座 ======================
const selectSeat = (seat: any) => {
  if (seat.status !== 'idle' && seat.status !== 'available') {
    ElMessage.warning('该座位不可用')
    return
  }
  selectedSeat.value = seat
  bookingForm.seatNumber = seat.number
}

const clearSeat = () => {
  selectedSeat.value = null
  bookingForm.seatNumber = ''
}

// ====================== 时间校验 ======================
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

// ====================== 提交预约 ======================
/** 真正调用 API 写入 db.json，刷新后数据不会丢失 */
const submitBooking = async () => {
  if (!selectedSeat.value) {
    ElMessage.error('请先选择座位')
    return
  }

  try {
    await bookingFormPanelRef.value?.validate()
  } catch {
    ElMessage.error('请检查表单填写是否正确')
    return
  }

  if (!validateBookingTime()) return

  submitting.value = true
  try {
    // 1. 创建预约，写入 db.json（持久化）
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

    // 2. 同步更新座位状态为占用
    await bookingStore.updateSeat(selectedSeat.value.id, {
      status: 'occupied',
      currentUser: bookingForm.userName
    })

    // 3. 弹出成功提示
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

// ====================== 重置与取消 ======================
const resetForm = () => {
  bookingFormPanelRef.value?.resetFields()
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

/** 取消预约 —— 更新预约状态，并同步释放座位 */
const cancelBooking = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '保留预约'
    })

    const booking = bookingStore.bookings.find(b => b.id === id)
    if (!booking) return

    // 1. 更新预约状态为已取消（持久化）
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

// ====================== 初始化 ======================
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
</style>
