<template>
  <div class="page-header">
    <h1>
      <i v-if="icon" :class="icon"></i>
      {{ title }}
    </h1>
    <p v-if="subtitle">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * PageHeader 页面标题区
 * 管理端首页与预约页原本各写了一份结构完全相同的标题区，这里统一成一个组件。
 */
defineProps<{
  /** 主标题 */
  title: string
  /** 副标题 / 说明文字 */
  subtitle?: string
  /** 标题前的图标 class，如 el-icon-s-management */
  icon?: string
}>()
</script>

<style scoped>
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
</style>
