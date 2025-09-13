<template>
  <div class="points-coupons">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>优惠券管理</span>
        </div>
      </template>
      <div class="coming-soon">
        <el-empty description="功能开发中，敬请期待..." />
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 优惠券管理功能开发中
</script>

<style scoped>
.points-coupons {
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