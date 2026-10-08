<template>
  <el-dialog
    :model-value="modelValue"
    title="添加违规记录"
    width="500px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="座位号" prop="seatNumber">
        <el-input v-model="form.seatNumber" placeholder="请输入座位号" />
      </el-form-item>
      <el-form-item label="用户" prop="userName">
        <el-input v-model="form.userName" placeholder="请输入用户姓名" />
      </el-form-item>
      <el-form-item label="违规类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择类型">
          <el-option
            v-for="type in VIOLATION_TYPE_OPTIONS"
            :key="type"
            :label="type"
            :value="type"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入违规描述"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="emit('submit')">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { VIOLATION_TYPE_OPTIONS } from '@/utils/dict'

/**
 * ViolationFormDialog 添加违规记录对话框
 */
defineProps<{
  modelValue: boolean
  form: Record<string, any>
  rules: Record<string, any>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: []
}>()

const formRef = ref<FormInstance>()

defineExpose({
  clearValidate: () => formRef.value?.clearValidate(),
  validate: () => formRef.value?.validate()
})
</script>
