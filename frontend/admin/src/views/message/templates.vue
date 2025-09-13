<template>
  <div class="message-templates">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息模板</span>
        </div>
      </template>
      <div class="coming-soon">
        <el-empty description="功能开发中，敬请期待..." />
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 消息模板功能开发中
</script>

<style scoped>
.message-templates {
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