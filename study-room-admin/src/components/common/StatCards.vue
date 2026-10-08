<template>
  <div class="stats-cards">
    <StatCard
      v-for="item in items"
      :key="item.label"
      :value="item.value"
      :label="item.label"
      :icon="item.icon"
      :color="item.color"
    />
  </div>
</template>

<script setup lang="ts">
import StatCard from './StatCard.vue'

export interface StatCardItem {
  value: string | number
  label: string
  icon: string
  color: string
}

/**
 * StatCards 统计卡片组
 * 传入一个数组即可渲染整排统计卡片，避免在每个面板里重复 v-for 结构。
 */
defineProps<{
  items: StatCardItem[]
}>()
</script>

<style scoped>
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
</style>
