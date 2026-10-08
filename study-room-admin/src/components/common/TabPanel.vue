<template>
  <div class="tab-content">
    <div class="tab-header">
      <h2>
        <i v-if="icon" :class="icon"></i>
        {{ title }}
      </h2>
      <div class="tab-actions">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * TabPanel 管理端面板外壳
 * 统一"标题 + 右上角操作按钮 + 内容区"的卡片结构，
 * 四个管理面板（预约 / 座位 / 违规 / 通知）共用。
 */
defineProps<{
  /** 面板标题 */
  title: string
  /** 标题图标 class */
  icon?: string
}>()
</script>

<style scoped>
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
</style>
