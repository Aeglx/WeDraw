<template>
  <div class="wecom-robot">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>机器人管理</span>
        </div>
      </template>
      <div class="coming-soon">
        <el-empty description="功能开发中，敬请期待..." />
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 机器人管理功能开发中
</script>

<style scoped>
.wecom-robot {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coming-soon {
  text-align: center;
  padding: 60px 0;
}
</style>