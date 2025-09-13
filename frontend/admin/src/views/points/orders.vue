<template>
  <div class="points-orders">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>积分订单</span>
        </div>
      </template>
      <div class="coming-soon">
        <el-empty description="功能开发中，敬请期待..." />
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 积分订单功能开发中
</script>

<style scoped>
.points-orders {
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