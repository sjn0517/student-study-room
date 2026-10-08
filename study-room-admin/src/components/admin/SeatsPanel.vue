<template>
  <TabPanel title="座位管理" icon="el-icon-office-building">
    <template #actions>
      <el-button type="primary" @click="showAddSeatDialog">
        <i class="el-icon-plus"></i> 添加座位
      </el-button>
      <el-button @click="refreshSeats">
        <i class="el-icon-refresh"></i> 刷新
      </el-button>
    </template>

    <!-- 座位统计 -->
    <StatCards :items="statItems" />

    <!-- 座位列表 -->
    <el-table :data="seats" style="width: 100%" v-loading="bookingStore.loading.seats">
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

    <!-- 添加 / 编辑座位 -->
    <SeatFormDialog
      ref="seatFormDialogRef"
      v-model="showSeatDialog"
      :title="seatDialogTitle"
      :form="seatForm"
      :rules="seatRules"
      :saving="savingSeat"
      @submit="saveSeat"
    />
  </TabPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBookingStore } from '@/stores/useBookingStore'
import TabPanel from '@/components/common/TabPanel.vue'
import StatCards from '@/components/common/StatCards.vue'
import SeatFormDialog from '@/components/admin/SeatFormDialog.vue'
import { getSeatStatusType, getSeatStatusText } from '@/utils/dict'

/**
 * SeatsPanel 座位管理面板
 */
const bookingStore = useBookingStore()

const seats = computed(() => bookingStore.seats || [])

// ====================== 统计卡片 ======================
const statItems = computed(() => [
  {
    value: seats.value.length,
    label: '总座位数',
    icon: 'el-icon-office-building',
    color: '#1890ff'
  },
  {
    value: bookingStore.availableSeatsCount,
    label: '可用座位',
    icon: 'el-icon-check',
    color: '#52c41a'
  },
  {
    value: bookingStore.occupiedSeatsCount,
    label: '占用中',
    icon: 'el-icon-user',
    color: '#f56c6c'
  },
  {
    value: bookingStore.maintenanceSeatsCount,
    label: '维修中',
    icon: 'el-icon-setting',
    color: '#e6a23c'
  }
])

// ====================== 表单 ======================
const showSeatDialog = ref(false)
const seatFormDialogRef = ref<InstanceType<typeof SeatFormDialog>>()
const savingSeat = ref(false)
const isEditingSeat = ref(false)

const seatForm = reactive({
  id: 0,
  number: '',
  area: '',
  features: [] as string[],
  status: 'idle' as 'idle' | 'occupied' | 'maintenance'
})

const seatRules = {
  number: [{ required: true, message: '请输入座位号', trigger: 'blur' }],
  area: [{ required: true, message: '请选择区域', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const seatDialogTitle = computed(() => (isEditingSeat.value ? '编辑座位' : '添加座位'))

const handleApiError = (error: any, defaultMsg: string) => {
  console.error(error)
  ElMessage.error(error?.message || defaultMsg)
}

// ====================== 数据加载 ======================
const refreshSeats = async () => {
  try {
    await bookingStore.fetchSeats()
    ElMessage.success('座位列表已刷新')
  } catch (error) {
    handleApiError(error, '刷新座位列表失败')
  }
}

// ====================== 新增 / 编辑 ======================
const openSeatDialog = () => {
  showSeatDialog.value = true
  nextTick(() => seatFormDialogRef.value?.clearValidate())
}

const showAddSeatDialog = () => {
  isEditingSeat.value = false
  seatForm.id = 0
  seatForm.number = ''
  seatForm.area = ''
  seatForm.features = []
  seatForm.status = 'idle'
  openSeatDialog()
}

const editSeat = (seat: any) => {
  isEditingSeat.value = true
  seatForm.id = seat.id
  seatForm.number = seat.number
  seatForm.area = seat.area
  seatForm.features = [...(seat.features || [])]
  seatForm.status = seat.status
  openSeatDialog()
}

const saveSeat = async () => {
  if (!seatFormDialogRef.value) return
  try {
    await seatFormDialogRef.value.validate()
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
      await bookingStore.updateSeat(seatForm.id, payload)
      ElMessage.success('座位更新成功')
    } else {
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

// ====================== 状态切换与删除 ======================
/** 设为维修 —— PATCH /seats/:id */
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

/** 恢复可用 —— PATCH /seats/:id */
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

/** 删除座位 —— DELETE /seats/:id */
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
</script>
