<!-- src/components/Base/BaseTable.vue -->
<template>
  <div class="base-table">
    <!-- 表格操作栏 -->
    <div v-if="showToolbar" class="table-toolbar">
      <!-- 左侧操作区 -->
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <!-- 默认操作按钮 -->
          <el-button
            v-if="showRefresh"
            type="primary"
            @click="handleRefresh"
            :loading="loading"
          >
            刷新
          </el-button>
          <el-button
            v-if="showAdd"
            type="primary"
            @click="handleAdd"
          >
            新增
          </el-button>
          <el-button
            v-if="showBatchDelete && hasSelection"
            type="danger"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </slot>
      </div>
      
      <!-- 右侧操作区 -->
      <div class="toolbar-right">
        <slot name="toolbar-right">
          <!-- 搜索框 -->
          <el-input
            v-if="showSearch"
            v-model="searchValue"
            placeholder="请输入搜索内容"
            clearable
            style="width: 200px; margin-right: 10px;"
            @input="handleSearch"
            @clear="handleSearchClear"
          />
          
          <!-- 表格设置 -->
          <el-dropdown
            v-if="showTableSettings"
            trigger="click"
            @command="handleSettingsCommand"
          >
            <el-button>
              设置
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(column, index) in columns"
                  :key="column.prop || index"
                  :command="column.prop"
                >
                  <el-checkbox
                    v-model="column.visible"
                    @change="handleColumnVisibilityChange(column)"
                  >
                    {{ column.label }}
                  </el-checkbox>
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <el-button link @click="resetColumns">
                    重置
                  </el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </slot>
      </div>
    </div>
    
    <!-- 表格主体 -->
    <el-table
      ref="tableRef"
      :data="tableData"
      v-bind="$attrs"
      v-loading="loading"
      :border="border"
      :stripe="stripe"
      :size="size"
      :height="height"
      :max-height="maxHeight"
      :fit="fit"
      :show-header="showHeader"
      :highlight-current-row="highlightCurrentRow"
      :row-key="rowKey"
      :empty-text="emptyText"
      :default-expand-all="defaultExpandAll"
      :row-class-name="rowClassName"
      :row-style="rowStyle"
      :cell-class-name="cellClassName"
      :cell-style="cellStyle"
      :header-row-class-name="headerRowClassName"
      :header-row-style="headerRowStyle"
      :header-cell-class-name="headerCellClassName"
      :header-cell-style="headerCellStyle"
      :tree-props="treeProps"
      :lazy="lazy"
      :load="load"
      @select="handleSelect"
      @select-all="handleSelectAll"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblclick"
      @row-contextmenu="handleRowContextmenu"
      @row-mouseenter="handleRowMouseenter"
      @row-mouseleave="handleRowMouseleave"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        :width="selectionWidth"
        :reserve-selection="reserveSelection"
      />
      
      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        :label="indexLabel"
        :width="indexWidth"
        :align="indexAlign"
      />
      
      <!-- 展开列 -->
      <el-table-column
        v-if="showExpand"
        type="expand"
        :width="expandWidth"
      >
        <template #default="scope">
          <slot name="expand" :row="scope.row" />
        </template>
      </el-table-column>
      
      <!-- 动态列 -->
      <template v-for="column in visibleColumns" :key="column.prop">
        <el-table-column
          v-bind="column"
          :show-overflow-tooltip="column.showOverflowTooltip ?? true"
        >
          <template v-if="column.slot" #[column.slot]="scope">
            <slot :name="column.slot" :row="scope.row" :$index="scope.$index" />
          </template>
        </el-table-column>
      </template>
      
      <!-- 操作列 -->
      <el-table-column
        v-if="showAction"
        :label="actionLabel"
        :width="actionWidth"
        :fixed="actionFixed"
        :align="actionAlign"
      >
        <template #default="scope">
          <slot name="action" :row="scope.row" :$index="scope.$index">
            <!-- 默认操作按钮 -->
            <el-button
              v-if="showView"
              type="primary"
              link
              @click="handleView(scope.row)"
            >
              查看
            </el-button>
            <el-button
              v-if="showEdit"
              type="primary"
              link
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="showDelete"
              type="danger"
              link
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页器 -->
    <div v-if="showPagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        :layout="layout"
        :small="paginationSmall"
        :disabled="paginationDisabled"
        :background="paginationBackground"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 从 props 中提取属性
const props = defineProps({
  // 数据相关
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  columns: {
    type: Array,
    default: () => []
  },
  rowKey: {
    type: String,
    default: 'id'
  },
  
  // 表格显示相关
  border: {
    type: Boolean,
    default: true
  },
  stripe: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default'
  },
  height: [String, Number],
  maxHeight: [String, Number],
  fit: {
    type: Boolean,
    default: true
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  highlightCurrentRow: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  
  // 工具栏相关
  showToolbar: {
    type: Boolean,
    default: true
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  showAdd: {
    type: Boolean,
    default: true
  },
  showBatchDelete: {
    type: Boolean,
    default: true
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  showTableSettings: {
    type: Boolean,
    default: true
  },
  
  // 表格功能相关
  showSelection: {
    type: Boolean,
    default: true
  },
  selectionWidth: {
    type: Number,
    default: 55
  },
  reserveSelection: {
    type: Boolean,
    default: false
  },
  showIndex: {
    type: Boolean,
    default: true
  },
  indexLabel: {
    type: String,
    default: '序号'
  },
  indexWidth: {
    type: Number,
    default: 80
  },
  indexAlign: {
    type: String,
    default: 'center'
  },
  showExpand: {
    type: Boolean,
    default: false
  },
  expandWidth: {
    type: Number,
    default: 50
  },
  showAction: {
    type: Boolean,
    default: true
  },
  actionLabel: {
    type: String,
    default: '操作'
  },
  actionWidth: {
    type: Number,
    default: 200
  },
  actionFixed: {
    type: [Boolean, String],
    default: 'right'
  },
  actionAlign: {
    type: String,
    default: 'center'
  },
  showView: {
    type: Boolean,
    default: true
  },
  showEdit: {
    type: Boolean,
    default: true
  },
  showDelete: {
    type: Boolean,
    default: true
  },
  
  // 分页相关
  showPagination: {
    type: Boolean,
    default: true
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  total: {
    type: Number,
    default: 0
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  paginationSmall: {
    type: Boolean,
    default: false
  },
  paginationDisabled: {
    type: Boolean,
    default: false
  },
  paginationBackground: {
    type: Boolean,
    default: true
  }
})

// 内部状态
const tableRef = ref()
const searchValue = ref('')
const selectedRows = ref<any[]>([])
const currentPage = ref(props.currentPage)
const pageSize = ref(props.pageSize)
const tableData = computed(() => props.data)

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)
const visibleColumns = computed(() => {
  return props.columns.filter(col => col.visible !== false)
})

// 事件
const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'add'): void
  (e: 'batch-delete', rows: any[]): void
  (e: 'search', value: string): void
  (e: 'view', row: any): void
  (e: 'edit', row: any): void
  (e: 'delete', row: any): void
  (e: 'select', rows: any[]): void
  (e: 'select-all', rows: any[]): void
  (e: 'selection-change', rows: any[]): void
  (e: 'row-click', row: any, column: any, event: Event): void
  (e: 'row-dblclick', row: any, column: any, event: Event): void
  (e: 'row-contextmenu', row: any, column: any, event: Event): void
  (e: 'row-mouseenter', row: any, column: any, event: Event): void
  (e: 'row-mouseleave', row: any, column: any, event: Event): void
  (e: 'sort-change', params: any): void
  (e: 'filter-change', filters: any): void
  (e: 'size-change', size: number): void
  (e: 'current-change', page: number): void
}>()

// 方法
const handleRefresh = () => {
  emit('refresh')
}

const handleAdd = () => {
  emit('add')
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条数据吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    emit('batch-delete', selectedRows.value)
  } catch {
    // 用户取消
  }
}

const handleSearch = () => {
  emit('search', searchValue.value)
}

const handleSearchClear = () => {
  searchValue.value = ''
  emit('search', '')
}

const handleView = (row: any) => {
  emit('view', row)
}

const handleEdit = (row: any) => {
  emit('edit', row)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条数据吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    emit('delete', row)
  } catch {
    // 用户取消
  }
}

const handleSelect = (selection: any[], row: any) => {
  selectedRows.value = selection
  emit('select', selection)
}

const handleSelectAll = (selection: any[]) => {
  selectedRows.value = selection
  emit('select-all', selection)
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

const handleRowClick = (row: any, column: any, event: Event) => {
  emit('row-click', row, column, event)
}

const handleRowDblclick = (row: any, column: any, event: Event) => {
  emit('row-dblclick', row, column, event)
}

const handleRowContextmenu = (row: any, column: any, event: Event) => {
  emit('row-contextmenu', row, column, event)
}

const handleRowMouseenter = (row: any, column: any, event: Event) => {
  emit('row-mouseenter', row, column, event)
}

const handleRowMouseleave = (row: any, column: any, event: Event) => {
  emit('row-mouseleave', row, column, event)
}

const handleSortChange = (params: any) => {
  emit('sort-change', params)
}

const handleFilterChange = (filters: any) => {
  emit('filter-change', filters)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  emit('size-change', size)
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  emit('current-change', page)
}

const handleSettingsCommand = (command: string) => {
  // 处理设置命令
}

const handleColumnVisibilityChange = (column: any) => {
  // 处理列可见性变化
}

const resetColumns = () => {
  // 重置列设置
}

// 公开方法
defineExpose({
  clearSelection: () => {
    tableRef.value?.clearSelection()
  },
  toggleRowSelection: (row: any, selected: boolean) => {
    tableRef.value?.toggleRowSelection(row, selected)
  },
  toggleAllSelection: () => {
    tableRef.value?.toggleAllSelection()
  },
  toggleRowExpansion: (row: any, expanded: boolean) => {
    tableRef.value?.toggleRowExpansion(row, expanded)
  },
  setCurrentRow: (row: any) => {
    tableRef.value?.setCurrentRow(row)
  },
  clearSort: () => {
    tableRef.value?.clearSort()
  },
  clearFilter: (columnKey?: string) => {
    tableRef.value?.clearFilter(columnKey)
  },
  doLayout: () => {
    tableRef.value?.doLayout()
  },
  sort: (prop: string, order: string) => {
    tableRef.value?.sort(prop, order)
  }
})
</script>

<style scoped>
.base-table {
  width: 100%;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>