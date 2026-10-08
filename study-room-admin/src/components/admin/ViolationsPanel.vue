<template>
  <TabPanel title="违规处理" icon="el-icon-warning">
    <template #actions>
      <el-button type="primary" @click="showAddViolationDialog">
        <i class="el-icon-plus"></i> 添加违规记录
      </el-button>
      <el-button @click="refreshViolations">
        <i class="el-icon-refresh"></i> 刷新
      </el-button>
    </template>

    <!-- 违规统计 -->
    <StatCards :items="statItems" />

    <!-- 违规列表 -->
    <el-table
      :data="violations"
      style="width: 100%"
      v-loading="bookingStore.loading.violations"
    >
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
          {{ formatDateTimeCN(row.createdAt || row.createTime) }}
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
            <el-button type="info" size="small" @click="showViolationDetails(row)">
              详情
            </el-button>
            <el-button type="danger" size="small" @click="deleteViolation(row.id)">
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加违规记录 -->
    <ViolationFormDialog
      ref="violationFormDialogRef"
      v-model="showViolationDialog"
      :form="violationForm"
      :rules="violationRules"
      @submit="saveViolation"
    />
  </TabPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBookingStore } from '@/stores/useBookingStore'
import TabPanel from '@/components/common/TabPanel.vue'
import StatCards from '@/components/common/StatCards.vue'
import ViolationFormDialog from '@/components/admin/ViolationFormDialog.vue'
import {
  formatDateTimeCN,
  getViolationTypeTag,
  getViolationStatusType,
  getViolationStatusText
} from '@/utils/dict'

/**
 * ViolationsPanel 违规处理面板
 */
const bookingStore = useBookingStore()

const violations = computed<any[]>(() => bookingStore.violations || [])

// ====================== 统计卡片 ======================
const statItems = computed(() => [
  {
    value: bookingStore.pendingViolationsCount,
    label: '待处理',
    icon: 'el-icon-timer',
    color: '#e6a23c'
  },
  {
    value: bookingStore.processedViolationsCount,
    label: '已处理',
    icon: 'el-icon-check',
    color: '#52c41a'
  }
])

// ====================== 表单 ======================
const showViolationDialog = ref(false)
const violationFormDialogRef = ref<InstanceType<typeof ViolationFormDialog>>()

const violationForm = reactive({
  seatNumber: '',
  userName: '',
  type: '',
  description: ''
})

const violationRules = {
  seatNumber: [{ required: true, message: '请输入座位号', trigger: 'blur' }],
  userName: [{ required: true, message: '请输入用户姓名', trigger: 'blur' }],
  type: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入违规描述', trigger: 'blur' }]
}

const handleApiError = (error: any, defaultMsg: string) => {
  console.error(error)
  ElMessage.error(error?.message || defaultMsg)
}

// ====================== 数据加载 ======================
const refreshViolations = async () => {
  try {
    await bookingStore.fetchViolations()
    ElMessage.success('违规列表已刷新')
  } catch (error) {
    handleApiError(error, '刷新违规列表失败')
  }
}

// ====================== 新增与处理 ======================
const showAddViolationDialog = () => {
  violationForm.seatNumber = ''
  violationForm.userName = ''
  violationForm.type = ''
  violationForm.description = ''
  showViolationDialog.value = true
  nextTick(() => violationFormDialogRef.value?.clearValidate())
}

const saveViolation = async () => {
  if (!violationFormDialogRef.value) return
  try {
    await violationFormDialogRef.value.validate()
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

/** 标记处理 —— PATCH /violations/:id */
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

/** 删除违规记录 —— DELETE /violations/:id */
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
</script>
