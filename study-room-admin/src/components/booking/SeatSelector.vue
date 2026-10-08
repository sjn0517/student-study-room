<template>
  <div class="seat-selection">
    <SectionHeader title="选择座位" icon="el-icon-location-information">
      <div class="legend">
        <span class="legend-item available"></span> 可用
        <span class="legend-item occupied"></span> 占用
        <span class="legend-item selected"></span> 选中
        <span class="legend-item maintenance"></span> 维护
      </div>
    </SectionHeader>

    <!-- 区域筛选 -->
    <div class="area-filters">
      <el-radio-group v-model="selectedArea">
        <el-radio-button label="all">全部区域</el-radio-button>
        <el-radio-button
          v-for="area in AREA_OPTIONS"
          :key="area"
          :label="area"
        >
          {{ area }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 座位网格 -->
    <div class="seats-grid" v-loading="loading">
      <div
        v-for="seat in filteredSeats"
        :key="seat.id"
        class="seat-item"
        :class="[seat.status, { selected: selectedSeat?.id === seat.id }]"
        @click="emit('select', seat)"
      >
        <div class="seat-number">{{ seat.number }}</div>
        <div class="seat-area">{{ seat.area }}</div>
        <div class="seat-status">
          <span v-if="seat.status === 'occupied'">占用中</span>
          <span v-else-if="seat.status === 'maintenance'">维修中</span>
          <span v-else>可用</span>
        </div>
        <div v-if="seat.features && seat.features.length > 0" class="seat-features">
          <el-tag
            v-for="feature in seat.features"
            :key="feature"
            size="small"
            type="info"
          >
            {{ feature }}
          </el-tag>
        </div>
      </div>
      <div v-if="filteredSeats.length === 0" class="empty-seats">
        <el-empty description="暂无座位数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/booking/SectionHeader.vue'

/**
 * SeatSelector 座位选择区
 * 负责区域筛选与座位网格展示，点击座位后把选中的座位抛给父组件。
 */
const props = defineProps<{
  /** 全量座位列表 */
  seats: any[]
  /** 当前选中的座位 */
  selectedSeat: any
  /** 座位列表加载状态 */
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [seat: any]
}>()

const AREA_OPTIONS = ['靠窗区', '中间区', '后排区']

const selectedArea = ref('all')

/** 按区域筛选座位 */
const filteredSeats = computed(() => {
  const allSeats = props.seats || []
  if (selectedArea.value === 'all') return allSeats
  return allSeats.filter(seat => seat.area === selectedArea.value)
})
</script>

<style scoped>
.legend {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.legend-item {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 5px;
  vertical-align: middle;
}

.legend-item.available {
  background-color: #67c23a;
}

.legend-item.occupied {
  background-color: #f56c6c;
}

.legend-item.selected {
  background-color: #409eff;
  border: 2px solid #409eff;
}

.legend-item.maintenance {
  background-color: #e6a23c;
}

.area-filters {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.seats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 300px;
}

.seat-item {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.seat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.seat-item.occupied {
  border-color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
  cursor: not-allowed;
}

.seat-item.occupied:hover {
  transform: none;
  box-shadow: none;
  border-color: #f56c6c;
}

.seat-item.maintenance {
  border-color: #e6a23c;
  background-color: rgba(230, 162, 60, 0.1);
  cursor: not-allowed;
}

.seat-item.selected {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  border-width: 3px;
}

.seat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.seat-area {
  font-size: 12px;
  color: #909399;
  background: rgba(144, 147, 153, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 8px;
  display: inline-block;
}

.seat-status {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.seat-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-top: 5px;
}

.empty-seats {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
</style>
