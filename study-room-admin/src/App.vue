<template>
  <div style="padding: 20px;">
    <h1>自习室预约系统</h1>
    
    <!-- 导航链接 -->
    <nav style="margin-bottom: 20px;">
      <router-link to="/">首页</router-link> | 
      <router-link to="/booking">预约</router-link> | 
      <router-link to="/admin">管理</router-link>
    </nav>

    <!-- 这里是页面显示的地方 -->
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
// 这里不需要写任何逻辑
</script>