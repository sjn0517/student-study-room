<!-- src/components/Base/BaseDialog.vue -->
<template>
  <el-dialog
    v-model="modelValue"
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :top="top"
    :modal="modal"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :custom-class="customClass"
    :open-delay="openDelay"
    :close-delay="closeDelay"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="handleBeforeClose"
    :draggable="draggable"
    :center="center"
    :align-center="alignCenter"
    :destroy-on-close="destroyOnClose"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
  >
    <!-- 内容插槽 -->
    <slot name="default" />
    
    <!-- 底部插槽 -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'

interface Props {
  modelValue: boolean
  title?: string
  width?: string | number
  fullscreen?: boolean
  top?: string
  modal?: boolean
  appendToBody?: boolean
  lockScroll?: boolean
  customClass?: string
  openDelay?: number
  closeDelay?: number
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  showClose?: boolean
  beforeClose?: (done: () => void) => void
  draggable?: boolean
  center?: boolean
  alignCenter?: boolean
  destroyOnClose?: boolean
  confirmBeforeClose?: boolean
  confirmMessage?: string
  confirmTitle?: string
  confirmType?: 'info' | 'success' | 'warning' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  width: '50%',
  top: '15vh',
  modal: true,
  appendToBody: false,
  lockScroll: true,
  openDelay: 0,
  closeDelay: 0,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showClose: true,
  draggable: false,
  center: false,
  alignCenter: false,
  destroyOnClose: false,
  confirmBeforeClose: false,
  confirmMessage: '确定要关闭吗？未保存的内容将会丢失。',
  confirmTitle: '提示',
  confirmType: 'warning',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close'): void
  (e: 'closed'): void
}>()

// 处理对话框关闭前的逻辑
const handleBeforeClose = (done: () => void) => {
  if (props.confirmBeforeClose) {
    ElMessageBox.confirm(props.confirmMessage, props.confirmTitle, {
      type: props.confirmType,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
      .then(() => {
        done()
      })
      .catch(() => {
        // 取消关闭
      })
  } else if (props.beforeClose) {
    props.beforeClose(done)
  } else {
    done()
  }
}

// 处理对话框打开
const handleOpen = () => {
  emit('open')
}

// 处理对话框打开完成
const handleOpened = () => {
  emit('opened')
}

// 处理对话框关闭
const handleClose = () => {
  emit('close')
  emit('update:modelValue', false)
}

// 处理对话框关闭完成
const handleClosed = () => {
  emit('closed')
}
</script>

<script lang="ts">
export default {
  name: 'BaseDialog',
}
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>