// src/components/index.ts
import type { App } from 'vue'

// 导入所有基础组件
const modules = import.meta.glob('./**/*.vue', { eager: true })

export default {
  install(app: App) {
    Object.keys(modules).forEach((key) => {
      const component = modules[key] as { default: any }
      const name = component.default.name || key.split('/').pop()?.replace('.vue', '')
      
      if (name && component.default) {
        app.component(name, component.default)
      }
    })
  }
}