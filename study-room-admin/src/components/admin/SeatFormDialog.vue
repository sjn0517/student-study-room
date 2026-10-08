<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="500px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="座位号" prop="number">
        <el-input v-model="form.number" placeholder="如：A01" />
      </el-form-item>
      <el-form-item label="区域" prop="area">
        <el-select v-model="form.area" placeholder="请选择区域">
          <el-option
            v-for="area in SEAT_AREA_OPTIONS"
            :key="area"
            :label="area"
            :value="area"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="设施" prop="features">
        <el-checkbox-group v-model="form.features">
          <el-checkbox
            v-for="feature in SEAT_FEATURE_OPTIONS"
            :key="feature"
            :label="feature"
          />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态">
          <el-option
            v-for="option in SEAT_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="emit('submit')">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { SEAT_AREA_OPTIONS, SEAT_FEATURE_OPTIONS, SEAT_STATUS_OPTIONS } from '@/utils/dict'

/**
 * SeatFormDialog 座位新增 / 编辑对话框
 * 只负责表单界面与校验，提交动作交给父组件（SeatsPanel）处理。
 */
defineProps<{
  modelValue: boolean
  title: string
  form: Record<string, any>
  rules: Record<string, any>
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: []
}>()

const formRef = ref<FormInstance>()

/** 供父组件在打开弹窗时清空上一次的校验提示 */
const clearValidate = () => formRef.value?.clearValidate()
const validate = () => formRef.value?.validate()

defineExpose({ clearValidate, validate })
</script>
