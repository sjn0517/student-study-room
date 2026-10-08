<template>
  <TabPanel title="预约管理" icon="el-icon-tickets">
    <template #actions>
      <el-button
        type="primary"
        :disabled="selectedBookings.length === 0"
        @click="handleApproveMultiple"
      >
        批量通过
      </el-button>
      <el-button
        type="warning"
        :disabled="selectedBookings.length === 0"
        @click="handleRejectMultiple"
      >
        批量拒绝
      </el-button>
      <el-button
        type="danger"
        :disabled="selectedBookings.length === 0"
        @click="handleCancelMultiple"
      >
        批量取消
      </el-button>
      <el-button @click="refreshBookings">
        <i class="el-icon-refresh"></i> 刷新
      </el-button>
    </template>

    <!-- 预约筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="bookingFilters.search"
        placeholder="搜索座位号/预约人"
        style="width: 200px; margin-right: 10px;"
        clearable
      />
      <el-select
        v-model="bookingFilters.status"
        placeholder="状态筛选"
        style="width: 120px; margin-right: 10px;"
        clearable
      >
        <el-option label="全部" value="" />
        <el-option
          v-for="option in BOOKING_STATUS_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-date-picker
        v-model="bookingFilters.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px; margin-right: 10px;"
      />
      <el-button type="primary" @click="refreshBookings">筛选</el-button>
      <el-button @click="resetBookingFilters">重置</el-button>
    </div>

    <!-- 预约列表 -->
    <el-table
      :data="filteredBookings"
      style="width: 100%"
      v-loading="bookingStore.loading.bookings"
      @selection-change="handleBookingSelectionChange"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="seatNumber" label="座位号" width="100" />
      <el-table-column prop="area" label="区域" width="100" />
      <el-table-column prop="userName" label="预约人" width="120" />
      <el-table-column prop="userId" label="学号" width="120" />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column label="预约时间" width="180">
        <template #default="{ row }">
          <div>{{ formatDateCN(row.date) }}</div>
          <div style="color: #909399; font-size: 12px;">
            {{ row.startTime }} - {{ row.endTime }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createdTime" label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatDateTimeCN(row.createdTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getBookingStatusType(row.status)" size="small">
            {{ getBookingStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleApproveBooking(row.id)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="warning"
              size="small"
              @click="handleRejectBooking(row.id)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'confirmed'"
              type="danger"
              size="small"
              @click="handleCancelBooking(row.id)"
            >
              取消
            </el-button>
            <el-button type="info" size="small" @click="showBookingDetails(row)">
              详情
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="bookingPagination.currentPage"
        v-model:page-size="bookingPagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="bookingPagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 预约详情 -->
    <BookingDetailDialog
      v-model="showBookingDetailsDialog"
      :booking="selectedBooking"
    />
  </TabPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBookingStore } from '@/stores/useBookingStore'
import TabPanel from '@/components/common/TabPanel.vue'
import BookingDetailDialog from '@/components/admin/BookingDetailDialog.vue'
import {
  BOOKING_STATUS_OPTIONS,
  formatDateCN,
  formatDateTimeCN,
  getBookingStatusType,
  getBookingStatusText
} from '@/utils/dict'

/**
 * BookingsPanel 预约管理面板
 * 对应管理后台"预约管理"标签页：筛选、批量审批、分页、查看详情。
 */
const bookingStore = useBookingStore()

// ====================== 筛选与分页 ======================
const bookingFilters = reactive({
  search: '',
  status: '',
  dateRange: [] as Date[]
})

const bookingPagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const selectedBookings = ref<any[]>([])
const showBookingDetailsDialog = ref(false)
const selectedBooking = ref<any>(null)

/** 按关键字 / 状态 / 日期范围筛选，再做前端分页 */
const filteredBookings = computed(() => {
  let list = bookingStore.bookings || []

  if (bookingFilters.search) {
    const keyword = bookingFilters.search.toLowerCase()
    list = list.filter(b =>
      (b.seatNumber || '').toLowerCase().includes(keyword) ||
      (b.userName || '').toLowerCase().includes(keyword) ||
      (b.userId || '').toLowerCase().includes(keyword)
    )
  }

  if (bookingFilters.status) {
    list = list.filter(b => b.status === bookingFilters.status)
  }

  if (bookingFilters.dateRange && bookingFilters.dateRange.length === 2) {
    const start = bookingFilters.dateRange[0]
    const end = bookingFilters.dateRange[1]
    if (start && end) {
      list = list.filter(b => {
        const d = new Date(b.date)
        return d >= new Date(start) && d <= new Date(end)
      })
    }
  }

  bookingPagination.total = list.length
  const from = (bookingPagination.currentPage - 1) * bookingPagination.pageSize
  return list.slice(from, from + bookingPagination.pageSize)
})

// ====================== 数据加载 ======================
const handleApiError = (error: any, defaultMsg: string) => {
  console.error(error)
  ElMessage.error(error?.message || defaultMsg)
}

const refreshBookings = async () => {
  try {
    await bookingStore.fetchBookings()
  } catch (error) {
    handleApiError(error, '加载预约列表失败')
  }
}

const resetBookingFilters = () => {
  bookingFilters.search = ''
  bookingFilters.status = ''
  bookingFilters.dateRange = []
  bookingPagination.currentPage = 1
}

const handleBookingSelectionChange = (selection: any[]) => {
  selectedBookings.value = selection
}

// ====================== 单条审批 ======================
/** 通过预约 —— Store.updateBooking → PATCH /bookings/:id */
const handleApproveBooking = async (id: number) => {
  try {
    await bookingStore.updateBooking(id, {
      status: 'confirmed',
      updatedTime: new Date().toISOString()
    })
    ElMessage.success('预约已通过')
    await refreshBookings()
  } catch (error) {
    handleApiError(error, '操作失败')
  }
}

/** 拒绝预约 */
const handleRejectBooking = async (id: number) => {
  try {
    await bookingStore.updateBooking(id, {
      status: 'cancelled',
      cancelledReason: '管理员拒绝',
      cancelledBy: 'admin',
      cancelledTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    })
    ElMessage.success('预约已拒绝')
    await refreshBookings()
  } catch (error) {
    handleApiError(error, '操作失败')
  }
}

/** 取消预约 */
const handleCancelBooking = async (id: number) => {
  try {
    await bookingStore.updateBooking(id, {
      status: 'cancelled',
      cancelledReason: '管理员取消',
      cancelledBy: 'admin',
      cancelledTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    })
    ElMessage.success('预约已取消')
    await refreshBookings()
  } catch (error) {
    handleApiError(error, '操作失败')
  }
}

// ====================== 批量操作 ======================
/** 批量更新状态：json-server 不支持批量接口，Store.batchUpdateStatus 内部逐条 PATCH */
const batchUpdate = async (status: string, actionText: string) => {
  if (!selectedBookings.value.length) return
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}选中的 ${selectedBookings.value.length} 个预约吗？`,
      '提示',
      { type: 'warning' }
    )
    const ids = selectedBookings.value.map(b => b.id)
    await bookingStore.batchUpdateStatus(ids, status)
    ElMessage.success(`批量${actionText}成功`)
    selectedBookings.value = []
    await refreshBookings()
  } catch (error: any) {
    if (error !== 'cancel') handleApiError(error, `批量${actionText}失败`)
  }
}

const handleApproveMultiple = () => batchUpdate('confirmed', '通过')
const handleRejectMultiple = () => batchUpdate('cancelled', '拒绝')
const handleCancelMultiple = () => batchUpdate('cancelled', '取消')

// ====================== 详情与分页事件 ======================
const showBookingDetails = (booking: any) => {
  selectedBooking.value = booking
  showBookingDetailsDialog.value = true
}

const handlePageSizeChange = (size: number) => {
  bookingPagination.pageSize = size
  bookingPagination.currentPage = 1
}

const handlePageChange = (page: number) => {
  bookingPagination.currentPage = page
}
</script>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
