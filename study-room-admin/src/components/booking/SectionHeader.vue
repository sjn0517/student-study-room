<template>
  <div class="section-header">
    <h2>
      <i v-if="icon" :class="icon"></i>
      {{ title }}
    </h2>
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * SectionHeader 区块小标题
 * 预约页左右两栏原本各写了一份同名结构，这里统一成一个组件。
 */
defineProps<{
  title: string
  icon?: string
}>()
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h2 {
  font-size: 20px;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
