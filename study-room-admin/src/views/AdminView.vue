<template>
  <div class="admin-page">
    <!-- 管理面板标题 -->
    <div class="admin-header">
      <h1><i class="el-icon-s-management"></i> 自习室管理系统</h1>
      <p>管理员控制面板 - 管理预约、座位、违规和通知</p>
    </div>

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

    <!-- 管理内容区域 -->
    <div class="admin-content">
      <!-- 预约管理 -->
      <div v-if="activeTab === 'bookings'" class="tab-content">
        <div class="tab-header">
          <h2><i class="el-icon-tickets"></i> 预约管理</h2>
          <div class="tab-actions">
            <el-button type="primary" @click="handleApproveMultiple" :disabled="selectedBookings.length === 0">
              批量通过
            </el-button>
            <el-button type="warning" @click="handleRejectMultiple" :disabled="selectedBookings.length === 0">
              批量拒绝
            </el-button>
            <el-button type="danger" @click="handleCancelMultiple" :disabled="selectedBookings.length === 0">
              批量取消
            </el-button>
            <el-button @click="refreshBookings">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
          </div>
        </div>

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
            <el-option label="待处理" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-date-picker
            v-model="bookingFilters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px; margin-right: 10px;"
          />
          <el-button type="primary" @click="refreshBookings">
            筛选
          </el-button>
          <el-button @click="resetBookingFilters">
            重置
          </el-button>
        </div>

        <!-- 预约列表 -->
        <el-table
          :data="filteredBookings"
          style="width: 100%"
          @selection-change="handleBookingSelectionChange"
          v-loading="loading.bookings"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="seatNumber" label="座位号" width="100" />
          <el-table-column prop="area" label="区域" width="100" />
          <el-table-column prop="userName" label="预约人" width="120" />
          <el-table-column prop="userId" label="学号" width="120" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column label="预约时间" width="180">
            <template #default="{ row }">
              <div>{{ formatDate(row.date) }}</div>
              <div style="color: #909399; font-size: 12px;">
                {{ row.startTime }} - {{ row.endTime }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="createdTime" label="创建时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.createdTime) }}
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
                <el-button
                  type="info"
                  size="small"
                  @click="showBookingDetails(row)"
                >
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
      </div>

      <!-- 座位管理 -->
      <div v-else-if="activeTab === 'seats'" class="tab-content">
        <div class="tab-header">
          <h2><i class="el-icon-office-building"></i> 座位管理</h2>
          <div class="tab-actions">
            <el-button type="primary" @click="showAddSeatDialog">
              <i class="el-icon-plus"></i> 添加座位
            </el-button>
            <el-button @click="refreshSeats">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
          </div>
        </div>

        <!-- 座位统计 -->
        <div class="stats-cards">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #1890ff;">
                <i class="el-icon-office-building"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ seats.length }}</div>
                <div class="stat-label">总座位数</div>
              </div>
            </div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #52c41a;">
                <i class="el-icon-check"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ availableSeatsCount }}</div>
                <div class="stat-label">可用座位</div>
              </div>
            </div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #f56c6c;">
                <i class="el-icon-user"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ occupiedSeatsCount }}</div>
                <div class="stat-label">占用中</div>
              </div>
            </div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #e6a23c;">
                <i class="el-icon-setting"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ maintenanceSeatsCount }}</div>
                <div class="stat-label">维修中</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 座位列表 -->
        <el-table :data="seats" style="width: 100%" v-loading="loading.seats">
          <el-table-column prop="number" label="座位号" width="100" />
          <el-table-column prop="area" label="区域" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getSeatStatusType(row.status)" size="small">
                {{ getSeatStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="设施" min-width="150">
            <template #default="{ row }">
              <el-space wrap>
                <el-tag
                  v-for="feature in row.features || []"
                  :key="feature"
                  size="small"
                  type="info"
                >
                  {{ feature }}
                </el-tag>
              </el-space>
            </template>
          </el-table-column>
          <el-table-column label="当前用户" width="150">
            <template #default="{ row }">
              <span v-if="row.currentUser">{{ row.currentUser }}</span>
              <span v-else style="color: #909399;">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button type="primary" size="small" @click="editSeat(row)">编辑</el-button>
                <el-button
                  v-if="row.status !== 'maintenance'"
                  type="warning"
                  size="small"
                  @click="setSeatMaintenance(row)"
                >
                  设为维修
                </el-button>
                <el-button
                  v-if="row.status === 'maintenance'"
                  type="success"
                  size="small"
                  @click="setSeatAvailable(row)"
                >
                  恢复可用
                </el-button>
                <el-button
                  v-if="!row.currentUser"
                  type="danger"
                  size="small"
                  @click="deleteSeat(row.id)"
                >
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 违规处理 -->
      <div v-else-if="activeTab === 'violations'" class="tab-content">
        <div class="tab-header">
          <h2><i class="el-icon-warning"></i> 违规处理</h2>
          <div class="tab-actions">
            <el-button type="primary" @click="showAddViolationDialog">
              <i class="el-icon-plus"></i> 添加违规记录
            </el-button>
            <el-button @click="refreshViolations">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
          </div>
        </div>

        <!-- 违规统计 -->
        <div class="stats-cards">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #e6a23c;">
                <i class="el-icon-timer"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ pendingViolationsCount }}</div>
                <div class="stat-label">待处理</div>
              </div>
            </div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #52c41a;">
                <i class="el-icon-check"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ processedViolationsCount }}</div>
                <div class="stat-label">已处理</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 违规列表 -->
        <el-table :data="violations" style="width: 100%" v-loading="loading.violations">
          <el-table-column prop="seatNumber" label="座位号" width="100" />
          <el-table-column prop="userName" label="用户" width="120" />
          <el-table-column prop="type" label="违规类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getViolationTypeTag(row.type)" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="createdAt" label="记录时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt || row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getViolationStatusType(row.status)" size="small">
                {{ getViolationStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button
                  v-if="row.status === 'pending'"
                  type="success"
                  size="small"
                  @click="handleProcessViolation(row.id)"
                >
                  标记处理
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  @click="showViolationDetails(row)"
                >
                  详情
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="deleteViolation(row.id)"
                >
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 系统通知 -->
      <div v-else-if="activeTab === 'notices'" class="tab-content">
        <div class="tab-header">
          <h2><i class="el-icon-chat-dot-square"></i> 系统通知</h2>
          <div class="tab-actions">
            <el-button type="primary" @click="showAddNoticeDialog">
              <i class="el-icon-plus"></i> 发布通知
            </el-button>
            <el-button @click="refreshNotices">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
          </div>
        </div>

        <!-- 通知列表 -->
        <div class="notices-list">
          <el-card
            v-for="notice in notices"
            :key="notice.id"
            shadow="hover"
            class="notice-card"
            :class="`priority-${notice.priority}`"
          >
            <div class="notice-header">
              <div class="notice-title">
                <el-tag :type="getNoticeTypeTag(notice.type)" size="small">
                  {{ getNoticeTypeText(notice.type) }}
                </el-tag>
                <h3>{{ notice.title }}</h3>
              </div>
              <div class="notice-actions">
                <el-button-group>
                  <el-button
                    v-if="notice.status === 'active'"
                    type="warning"
                    size="small"
                    @click="expireNotice(notice.id)"
                  >
                    过期
                  </el-button>
                  <el-button
                    v-if="notice.status === 'expired'"
                    type="success"
                    size="small"
                    @click="activateNotice(notice.id)"
                  >
                    激活
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="deleteNotice(notice.id)"
                  >
                    删除
                  </el-button>
                </el-button-group>
              </div>
            </div>
            <div class="notice-content">
              <p>{{ notice.content }}</p>
            </div>
            <div class="notice-footer">
              <div class="notice-meta">
                <span><i class="el-icon-time"></i> {{ formatDateTime(notice.createdAt || notice.createTime) }}</span>
                <span v-if="notice.expireTime">
                  <i class="el-icon-alarm-clock"></i> 过期时间: {{ formatDateTime(notice.expireTime) }}
                </span>
              </div>
              <div class="notice-status">
                <el-tag :type="getNoticeStatusType(notice.status)" size="small">
                  {{ getNoticeStatusText(notice.status) }}
                </el-tag>
              </div>
            </div>
          </el-card>
          <el-empty v-if="notices.length === 0" description="暂无通知" />
        </div>
      </div>

    </div>
  </div>

  <!-- 添加/编辑座位对话框 -->
  <el-dialog v-model="showSeatDialog" :title="seatDialogTitle" width="500px">
    <el-form :model="seatForm" :rules="seatRules" ref="seatFormRef" label-width="100px">
      <el-form-item label="座位号" prop="number">
        <el-input v-model="seatForm.number" placeholder="如：A01" />
      </el-form-item>
      <el-form-item label="区域" prop="area">
        <el-select v-model="seatForm.area" placeholder="请选择区域">
          <el-option label="靠窗区" value="靠窗区" />
          <el-option label="中间区" value="中间区" />
          <el-option label="后排区" value="后排区" />
          <el-option label="VIP区" value="VIP区" />
        </el-select>
      </el-form-item>
      <el-form-item label="设施" prop="features">
        <el-checkbox-group v-model="seatForm.features">
          <el-checkbox label="插座" />
          <el-checkbox label="台灯" />
          <el-checkbox label="储物柜" />
          <el-checkbox label="白板" />
          <el-checkbox label="投影仪" />
          <el-checkbox label="隐私帘" />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="seatForm.status" placeholder="请选择状态">
          <el-option label="可用" value="idle" />
          <el-option label="占用" value="occupied" />
          <el-option label="维修" value="maintenance" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showSeatDialog = false">取消</el-button>
      <el-button type="primary" @click="saveSeat" :loading="savingSeat">保存</el-button>
    </template>
  </el-dialog>

  <!-- 添加违规对话框 -->
  <el-dialog v-model="showViolationDialog" title="添加违规记录" width="500px">
    <el-form :model="violationForm" :rules="violationRules" ref="violationFormRef" label-width="100px">
      <el-form-item label="座位号" prop="seatNumber">
        <el-input v-model="violationForm.seatNumber" placeholder="请输入座位号" />
      </el-form-item>
      <el-form-item label="用户" prop="userName">
        <el-input v-model="violationForm.userName" placeholder="请输入用户姓名" />
      </el-form-item>
      <el-form-item label="违规类型" prop="type">
        <el-select v-model="violationForm.type" placeholder="请选择类型">
          <el-option label="超时占用" value="超时占用" />
          <el-option label="噪音干扰" value="噪音干扰" />
          <el-option label="物品占座" value="物品占座" />
          <el-option label="设备损坏" value="设备损坏" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="violationForm.description" type="textarea" :rows="3" placeholder="请输入违规描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showViolationDialog = false">取消</el-button>
      <el-button type="primary" @click="saveViolation">保存</el-button>
    </template>
  </el-dialog>

  <!-- 发布通知对话框 -->
  <el-dialog v-model="showNoticeDialog" title="发布系统通知" width="600px">
    <el-form :model="noticeForm" :rules="noticeRules" ref="noticeFormRef" label-width="100px">
      <el-form-item label="通知类型" prop="type">
        <el-select v-model="noticeForm.type" placeholder="请选择类型">
          <el-option label="系统通知" value="system" />
          <el-option label="维护通知" value="maintenance" />
          <el-option label="活动通知" value="activity" />
          <el-option label="紧急通知" value="urgent" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="noticeForm.priority" placeholder="请选择优先级">
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="noticeForm.title" placeholder="请输入通知标题" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input v-model="noticeForm.content" type="textarea" :rows="4" placeholder="请输入通知内容" />
      </el-form-item>
      <el-form-item label="过期时间" prop="expireTime">
        <el-date-picker
          v-model="noticeForm.expireTime"
          type="datetime"
          placeholder="选择过期时间"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showNoticeDialog = false">取消</el-button>
      <el-button type="primary" @click="saveNotice">发布</el-button>
    </template>
  </el-dialog>

  <!-- 预约详情对话框 -->
  <el-dialog v-model="showBookingDetailsDialog" title="预约详情" width="600px">
    <div v-if="selectedBooking" class="booking-details">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="座位号">{{ selectedBooking.seatNumber }}</el-descriptions-item>
        <el-descriptions-item label="区域">{{ selectedBooking.area }}</el-descriptions-item>
        <el-descriptions-item label="预约人">{{ selectedBooking.userName }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ selectedBooking.userId }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ selectedBooking.phone }}</el-descriptions-item>
        <el-descriptions-item label="预约日期">{{ formatDate(selectedBooking.date) }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ selectedBooking.startTime }} - {{ selectedBooking.endTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getBookingStatusType(selectedBooking.status)" size="small">
            {{ getBookingStatusText(selectedBooking.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(selectedBooking.createdTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ selectedBooking.note || '无' }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useBookingStore } from '@/stores/useBookingStore'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'

const bookingStore = useBookingStore()

// ====================== 响应式数据 ======================
const activeTab = ref('bookings')
const loading = reactive({
  bookings: false,
  seats: false,
  violations: false,
  notices: false
})

// 预约管理
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

// 座位管理
const showSeatDialog = ref(false)
const seatFormRef = ref<FormInstance>()
const seatForm = reactive({
  id: 0,
  number: '',
  area: '',
  features: [] as string[],
  status: 'idle'
})
const isEditingSeat = ref(false)
const savingSeat = ref(false)

// 违规处理
const showViolationDialog = ref(false)
const violationFormRef = ref<FormInstance>()
const violationForm = reactive({
  seatNumber: '',
  userName: '',
  type: '',
  description: ''
})

// 通知管理
const showNoticeDialog = ref(false)
const noticeFormRef = ref<FormInstance>()
const noticeForm = reactive({
  type: 'system',
  priority: 'medium',
  title: '',
  content: '',
  expireTime: '' as string | Date
})

// ====================== 计算属性 ======================
const seats = computed(() => bookingStore.seats || [])
const violations = computed(() => bookingStore.violations || [])
const notices = computed(() => bookingStore.notices || [])
const availableSeatsCount = computed(() => bookingStore.availableSeatsCount)
const occupiedSeatsCount = computed(() => bookingStore.occupiedSeatsCount)
const maintenanceSeatsCount = computed(() => bookingStore.maintenanceSeatsCount)
const pendingViolationsCount = computed(() => bookingStore.pendingViolationsCount)
const processedViolationsCount = computed(() => bookingStore.processedViolationsCount)

const filteredBookings = computed(() => {
  let list = bookingStore.bookings || []

  if (bookingFilters.search) {
    const s = bookingFilters.search.toLowerCase()
    list = list.filter(b =>
      (b.seatNumber || '').toLowerCase().includes(s) ||
      (b.userName || '').toLowerCase().includes(s) ||
      (b.userId || '').toLowerCase().includes(s)
    )
  }
  if (bookingFilters.status) {
    list = list.filter(b => b.status === bookingFilters.status)
  }
  if (bookingFilters.dateRange && bookingFilters.dateRange.length === 2) {
    const [start, end] = bookingFilters.dateRange
    list = list.filter(b => {
      const d = new Date(b.date)
      return d >= new Date(start) && d <= new Date(end)
    })
  }

  bookingPagination.total = list.length
  const from = (bookingPagination.currentPage - 1) * bookingPagination.pageSize
  return list.slice(from, from + bookingPagination.pageSize)
})

const seatDialogTitle = computed(() => isEditingSeat.value ? '编辑座位' : '添加座位')

// ====================== 表单验证规则 ======================
const seatRules = {
  number: [{ required: true, message: '请输入座位号', trigger: 'blur' }],
  area: [{ required: true, message: '请选择区域', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}
const violationRules = {
  seatNumber: [{ required: true, message: '请输入座位号', trigger: 'blur' }],
  userName: [{ required: true, message: '请输入用户姓名', trigger: 'blur' }],
  type: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入违规描述', trigger: 'blur' }]
}
const noticeRules = {
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }]
}

// ====================== 通用错误处理 ======================
const handleApiError = (error: any, defaultMsg: string) => {
  console.error(error)
  ElMessage.error(error?.message || defaultMsg)
}

// ====================== 导航 ======================
const handleTabSelect = (key: string) => {
  activeTab.value = key
}

// ====================== 预约管理 ======================
/**
 * 加载预约列表（直接通过 Store → API → json-server）
 */
const refreshBookings = async () => {
  loading.bookings = true
  try {
    await bookingStore.fetchBookings()
  } catch (error) {
    handleApiError(error, '加载预约列表失败')
  } finally {
    loading.bookings = false
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

/**
 * 通过预约 —— 使用 Store.updateBooking 发 PATCH /bookings/:id（标准 json-server）
 */
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

/**
 * 拒绝预约 —— PATCH /bookings/:id { status: 'cancelled' }
 */
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

/**
 * 取消预约 —— PATCH /bookings/:id { status: 'cancelled' }
 */
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

/**
 * 批量通过 —— 逐条 PATCH（json-server 不支持批量，Store.batchUpdateStatus 已处理）
 */
const handleApproveMultiple = async () => {
  if (!selectedBookings.value.length) return
  try {
    await ElMessageBox.confirm(
      `确定要通过选中的 ${selectedBookings.value.length} 个预约吗？`,
      '提示',
      { type: 'warning' }
    )
    const ids = selectedBookings.value.map(b => b.id)
    await bookingStore.batchUpdateStatus(ids, 'confirmed')
    ElMessage.success('批量通过成功')
    selectedBookings.value = []
    await refreshBookings()
  } catch (error: any) {
    if (error !== 'cancel') handleApiError(error, '批量通过失败')
  }
}

/**
 * 批量拒绝
 */
const handleRejectMultiple = async () => {
  if (!selectedBookings.value.length) return
  try {
    await ElMessageBox.confirm(
      `确定要拒绝选中的 ${selectedBookings.value.length} 个预约吗？`,
      '提示',
      { type: 'warning' }
    )
    const ids = selectedBookings.value.map(b => b.id)

    
    await bookingStore.batchUpdateStatus(ids, 'cancelled')
    ElMessage.success('批量拒绝成功')
    selectedBookings.value = []
    await refreshBookings()
  } catch (error: any) {
    if (error !== 'cancel') handleApiError(error, '批量拒绝失败')
  }
}

/**
 * 批量取消
 */
const handleCancelMultiple = async () => {
  if (!selectedBookings.value.length) return
  try {
    await ElMessageBox.confirm(
      `确定要取消选中的 ${selectedBookings.value.length} 个预约吗？`,
      '提示',
      { type: 'warning' }
    )
    const ids = selectedBookings.value.map(b => b.id)
    await bookingStore.batchUpdateStatus(ids, 'cancelled')
    ElMessage.success('批量取消成功')
    selectedBookings.value = []
    await refreshBookings()
  } catch (error: any) {
    if (error !== 'cancel') handleApiError(error, '批量取消失败')
  }
}

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

// ====================== 座位管理 ======================
const refreshSeats = async () => {
  loading.seats = true
  try {
    await bookingStore.fetchSeats()
    ElMessage.success('座位列表已刷新')
  } catch (error) {
    handleApiError(error, '刷新座位列表失败')
  } finally {
    loading.seats = false
  }
}

const showAddSeatDialog = () => {
  isEditingSeat.value = false
  seatForm.id = 0
  seatForm.number = ''
  seatForm.area = ''
  seatForm.features = []
  seatForm.status = 'idle'
  showSeatDialog.value = true
  nextTick(() => seatFormRef.value?.clearValidate())
}

const editSeat = (seat: any) => {
  isEditingSeat.value = true
  seatForm.id = seat.id
  seatForm.number = seat.number
  seatForm.area = seat.area
  seatForm.features = [...(seat.features || [])]
  seatForm.status = seat.status
  showSeatDialog.value = true
  nextTick(() => seatFormRef.value?.clearValidate())
}

const saveSeat = async () => {
  if (!seatFormRef.value) return
  try {
    await seatFormRef.value.validate()
  } catch {
    return
  }
  savingSeat.value = true
  try {
    const payload = {
      number: seatForm.number,
      area: seatForm.area,
      features: seatForm.features,
      status: seatForm.status
    }
    if (isEditingSeat.value) {
      // PATCH /seats/:id —— json-server 标准路由
      await bookingStore.updateSeat(seatForm.id, payload)
      ElMessage.success('座位更新成功')
    } else {
      // POST /seats —— json-server 标准路由
      await bookingStore.addSeat(payload)
      ElMessage.success('座位添加成功')
    }
    await refreshSeats()
    showSeatDialog.value = false
  } catch (error) {
    handleApiError(error, isEditingSeat.value ? '更新座位失败' : '添加座位失败')
  } finally {
    savingSeat.value = false
  }
}

/**
 * 设为维修 —— PATCH /seats/:id { status: 'maintenance' }（标准 json-server）
 */
const setSeatMaintenance = async (seat: any) => {
  try {
    await ElMessageBox.confirm('确定要将此座位设为维修状态吗？', '提示', { type: 'warning' })
    await bookingStore.updateSeat(seat.id, {
      status: 'maintenance',
      updatedAt: new Date().toISOString()
    })
    ElMessage.success('座位已设为维修状态')
    await refreshSeats()
  } catch (error: any) {
    if (error !== 'cancel') handleApiError(error, '操作失败')
  }
}

/**
 * 恢复可用 —— PATCH /seats/:id { status: 'idle' }（标准 json-server）
 */
const setSeatAvailable = async (seat: any) => {
  try {
    await bookingStore.updateSeat(seat.id, {
      status: 'idle',
      updatedAt: new Date().toISOString()
    })
    ElMessage.success('座位已恢复可用状态')
    await refreshSeats()
  } catch (error) {
    handleApiError(error, '操作失败')
  }
}

/**
 * 删除座位 —— DELETE /seats/:id（标准 json-server）
 */
const deleteSeat = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除此座位吗？', '提示', { type: 'warning' })
    await bookingStore.removeSeat(id)
    ElMessage.success('座位删除成功')
    await refreshSeats()
  } catch (error: any) {
    if (error !== 'cancel') handleApiError(error, '删除座位失败')
  }
}

// ====================== 违规管理 ======================
const refreshViolations = async () => {
  loading.violations = true
  try {
    await bookingStore.fetchViolations()
    ElMessage.success('违规列表已刷新')
  } catch (error) {
    handleApiError(error, '刷新违规列表失败')
  } finally {
    loading.violations = false
  }
}

const showAddViolationDialog = () => {
  violationForm.seatNumber = ''
  violationForm.userName = ''
  violationForm.type = ''
  violationForm.description = ''
  showViolationDialog.value = true
  nextTick(() => violationFormRef.value?.clearValidate())
}

const saveViolation = async () => {
  if (!violationFormRef.value) return
  try {
    await violationFormRef.value.validate()
  } catch {
    return
  }
  try {
    await bookingStore.addViolation({
      seatNumber: violationForm.seatNumber,
      userName: violationForm.userName,
      type: violationForm.type as any,
      description: violationForm.description,
      status: 'pending'
    })
    ElMessage.success('违规记录添加成功')
    showViolationDialog.value = false
    await refreshViolations()
  } catch (error) {
    handleApiError(error, '添加违规记录失败')
  }
}

/**
 * 标记违规处理 —— PATCH /violations/:id { status: 'processed' }（标准 json-server）
 */
const handleProcessViolation = async (id: number) => {
  try {
    await bookingStore.processViolation(id, 'admin')
    ElMessage.success('违规已标记为已处理')
    await refreshViolations()
  } catch (error) {
    handleApiError(error, '操作失败')
  }
}

const showViolationDetails = (violation: any) => {
  ElMessageBox.alert(violation.description, '违规详情', { confirmButtonText: '确定' })
}

/**
 * 删除违规记录 —— DELETE /violations/:id（标准 json-server）
 */
const deleteViolation = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除此违规记录吗？', '提示', { type: 'warning' })
    await bookingStore.removeViolation(id)
    ElMessage.success('违规记录删除成功')
    await refreshViolations()
  } catch (error: any) {
    if (error !== 'cancel') handleApiError(error, '删除违规记录失败')
  }
}

// ====================== 通知管理 ======================
const refreshNotices = async () => {
  loading.notices = true
  try {
    await bookingStore.fetchNotices()
    ElMessage.success('通知列表已刷新')
  } catch (error) {
    handleApiError(error, '刷新通知列表失败')
  } finally {
    loading.notices = false
  }
}

const showAddNoticeDialog = () => {
  noticeForm.type = 'system'
  noticeForm.priority = 'medium'
  noticeForm.title = ''
  noticeForm.content = ''
  noticeForm.expireTime = ''
  showNoticeDialog.value = true
  nextTick(() => noticeFormRef.value?.clearValidate())
}

const saveNotice = async () => {
  if (!noticeFormRef.value) return
  try {
    await noticeFormRef.value.validate()
  } catch {
    return
  }
  try {
    await bookingStore.addNotice({
      type: noticeForm.type as any,
      priority: noticeForm.priority as any,
      title: noticeForm.title,
      content: noticeForm.content,
      expireTime: noticeForm.expireTime
        ? new Date(noticeForm.expireTime).toISOString()
        : undefined,
      status: 'active'
    })
    ElMessage.success('通知发布成功')
    showNoticeDialog.value = false
    await refreshNotices()
  } catch (error) {
    handleApiError(error, '发布通知失败')
  }
}

/**
 * 过期通知 —— PATCH /notices/:id { status: 'expired' }（标准 json-server）
 */
const expireNotice = async (id: number) => {
  try {
    await bookingStore.updateNotice(id, {
      status: 'expired',
      updatedAt: new Date().toISOString()
    })
    ElMessage.success('通知已标记为过期')
    await refreshNotices()
  } catch (error) {
    handleApiError(error, '操作失败')
  }
}

/**
 * 激活通知 —— PATCH /notices/:id { status: 'active' }（标准 json-server）
 */
const activateNotice = async (id: number) => {
  try {
    await bookingStore.updateNotice(id, {
      status: 'active',
      updatedAt: new Date().toISOString()
    })
    ElMessage.success('通知已重新激活')
    await refreshNotices()
  } catch (error) {
    handleApiError(error, '操作失败')
  }
}

/**
 * 删除通知 —— DELETE /notices/:id（标准 json-server）
 */
const deleteNotice = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除此通知吗？', '提示', { type: 'warning' })
    await bookingStore.removeNotice(id)
    ElMessage.success('通知删除成功')
    await refreshNotices()
  } catch (error: any) {
    if (error !== 'cancel') handleApiError(error, '删除通知失败')
  }
}

// ====================== 工具函数 ======================
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getBookingStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning', confirmed: 'success', cancelled: 'danger', completed: 'info'
  }
  return map[status] || 'info'
}
const getBookingStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待确认', confirmed: '已确认', cancelled: '已取消', completed: '已完成'
  }
  return map[status] || status
}
const getSeatStatusType = (status: string) => {
  const map: Record<string, string> = {
    idle: 'success', available: 'success', occupied: 'danger', maintenance: 'warning'
  }
  return map[status] || 'info'
}
const getSeatStatusText = (status: string) => {
  const map: Record<string, string> = {
    idle: '可用', available: '可用', occupied: '占用中', maintenance: '维修中'
  }
  return map[status] || status
}
const getViolationTypeTag = (type: string) => {
  const map: Record<string, string> = {
    '超时占用': 'danger', '噪音干扰': 'warning', '物品占座': 'info', '设备损坏': 'warning', '其他': 'info'
  }
  return map[type] || 'info'
}
const getViolationStatusType = (status: string) => {
  return status === 'processed' ? 'success' : 'warning'
}
const getViolationStatusText = (status: string) => {
  return status === 'processed' ? '已处理' : '待处理'
}
const getNoticeTypeTag = (type: string) => {
  const map: Record<string, string> = {
    system: 'info', maintenance: 'warning', activity: 'success', urgent: 'danger'
  }
  return map[type] || 'info'
}
const getNoticeTypeText = (type: string) => {
  const map: Record<string, string> = {
    system: '系统', maintenance: '维护', activity: '活动', urgent: '紧急'
  }
  return map[type] || '系统'
}
const getNoticeStatusType = (status: string) => {
  return status === 'active' ? 'success' : 'info'
}
const getNoticeStatusText = (status: string) => {
  return status === 'active' ? '生效中' : '已过期'
}
// ====================== 初始化 ======================
onMounted(async () => {
  try {
    await Promise.all([
      bookingStore.fetchBookings(),
      bookingStore.fetchSeats(),
      bookingStore.fetchViolations(),
      bookingStore.fetchNotices()
    ])
  } catch (error) {
    handleApiError(error, '加载初始数据失败')
  }
})
</script>

<style scoped>
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.admin-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}
.admin-header h1 {
  color: #303133;
  font-size: 28px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.admin-header p {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

.admin-nav { margin-bottom: 30px; }
.admin-menu { border-bottom: 1px solid #e4e7ed; }
.admin-content { min-height: 500px; }

.tab-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}
.tab-header h2 {
  font-size: 20px;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tab-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card { border: none; }
.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}
.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}
.stat-info { flex: 1; }
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}
.stat-label { font-size: 14px; color: #909399; }

.notices-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.notice-card {
  border: none;
  transition: all 0.3s;
}
.notice-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
}
.notice-card.priority-high { border-left: 4px solid #f56c6c; }
.notice-card.priority-medium { border-left: 4px solid #e6a23c; }
.notice-card.priority-low { border-left: 4px solid #409eff; }

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.notice-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.notice-title h3 { margin: 0; font-size: 16px; color: #303133; }
.notice-actions { display: flex; gap: 8px; }
.notice-content { color: #606266; line-height: 1.6; margin-bottom: 15px; }
.notice-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}
.notice-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}
.notice-meta span { display: flex; align-items: center; gap: 4px; }

.booking-details { padding: 10px 0; }
</style>