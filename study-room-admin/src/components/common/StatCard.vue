<template>
  <el-card shadow="hover" class="stat-card">
    <div class="stat-content">
      <div class="stat-icon" :style="{ background: color }">
        <i :class="icon"></i>
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ value }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
/**
 * StatCard 统计数字卡片
 */
defineProps<{
  /** 数值 */
  value: string | number
  /** 说明文字 */
  label: string
  /** 图标 class */
  icon: string
  /** 图标底色 */
  color: string
}>()
</script>

<style scoped>
.stat-card {
  border: none;
}

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

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
