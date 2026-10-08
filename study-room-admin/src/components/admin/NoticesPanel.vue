<template>
  <TabPanel title="系统通知" icon="el-icon-chat-dot-square">
    <template #actions>
      <el-button type="primary" @click="showAddNoticeDialog">
        <i class="el-icon-plus"></i> 发布通知
      </el-button>
      <el-button @click="refreshNotices">
        <i class="el-icon-refresh"></i> 刷新
      </el-button>
    </template>

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
              <el-button type="danger" size="small" @click="deleteNotice(notice.id)">
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
            <span>
              <i class="el-icon-time"></i>
              {{ formatDateTimeCN(notice.createdAt || notice.createTime) }}
            </span>
            <span v-if="notice.expireTime">
              <i class="el-icon-alarm-clock"></i>
              过期时间: {{ formatDateTimeCN(notice.expireTime) }}
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

    <!-- 发布通知 -->
    <NoticeFormDialog
      ref="noticeFormDialogRef"
      v-model="showNoticeDialog"
      :form="noticeForm"
      :rules="noticeRules"
      @submit="saveNotice"
    />
  </TabPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBookingStore } from '@/stores/useBookingStore'
import TabPanel from '@/components/common/TabPanel.vue'
import NoticeFormDialog from '@/components/admin/NoticeFormDialog.vue'
import {
  formatDateTimeCN,
  getNoticeTypeTag,
  getNoticeTypeText,
  getNoticeStatusType,
  getNoticeStatusText
} from '@/utils/dict'

/**
 * NoticesPanel 系统通知面板
 */
const bookingStore = useBookingStore()

const notices = computed<any[]>(() => bookingStore.notices || [])

// ====================== 表单 ======================
const showNoticeDialog = ref(false)
const noticeFormDialogRef = ref<InstanceType<typeof NoticeFormDialog>>()

const noticeForm = reactive({
  type: 'system',
  priority: 'medium',
  title: '',
  content: '',
  expireTime: '' as string | Date
})

const noticeRules = {
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }]
}

const handleApiError = (error: any, defaultMsg: string) => {
  console.error(error)
  ElMessage.error(error?.message || defaultMsg)
}

// ====================== 数据加载 ======================
const refreshNotices = async () => {
  try {
    await bookingStore.fetchNotices()
    ElMessage.success('通知列表已刷新')
  } catch (error) {
    handleApiError(error, '刷新通知列表失败')
  }
}

// ====================== 发布与状态切换 ======================
const showAddNoticeDialog = () => {
  noticeForm.type = 'system'
  noticeForm.priority = 'medium'
  noticeForm.title = ''
  noticeForm.content = ''
  noticeForm.expireTime = ''
  showNoticeDialog.value = true
  nextTick(() => noticeFormDialogRef.value?.clearValidate())
}

const saveNotice = async () => {
  if (!noticeFormDialogRef.value) return
  try {
    await noticeFormDialogRef.value.validate()
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

/** 标记过期 —— PATCH /notices/:id */
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

/** 重新激活 —— PATCH /notices/:id */
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

/** 删除通知 —— DELETE /notices/:id */
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
</script>

<style scoped>
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

.notice-card.priority-high {
  border-left: 4px solid #f56c6c;
}

.notice-card.priority-medium {
  border-left: 4px solid #e6a23c;
}

.notice-card.priority-low {
  border-left: 4px solid #409eff;
}

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

.notice-title h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.notice-actions {
  display: flex;
  gap: 8px;
}

.notice-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

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

.notice-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
