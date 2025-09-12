<template>
  <div class="empty-container" :class="containerClasses">
    <div class="empty-content">
      <div class="empty-image">
        <img v-if="image" :src="image" :alt="description" />
        <svg v-else class="empty-icon" viewBox="0 0 64 41">
          <g transform="translate(0 1)" fill="none" fill-rule="evenodd">
            <ellipse fill="#F5F5F5" cx="32" cy="33" rx="32" ry="7"></ellipse>
            <g fill-rule="nonzero" stroke="#D9D9D9">
              <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path>
              <path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" fill="#FAFAFA"></path>
            </g>
          </g>
        </svg>
      </div>
      <div class="empty-description">
        <span v-if="description">{{ description }}</span>
        <span v-else>暂无数据</span>
      </div>
      <div v-if="$slots.action || actionText" class="empty-action">
        <slot name="action">
          <el-button v-if="actionText" type="primary" @click="handleAction">
            {{ actionText }}
          </el-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Empty',
  props: {
    // 描述文字
    description: {
      type: String,
      default: ''
    },
    // 自定义图片
    image: {
      type: String,
      default: ''
    },
    // 图片大小
    imageSize: {
      type: [String, Number],
      default: 'normal'
    },
    // 操作按钮文字
    actionText: {
      type: String,
      default: ''
    },
    // 是否简单模式
    simple: {
      type: Boolean,
      default: false
    }
  },
  emits: ['action'],
  computed: {
    containerClasses() {
      return {
        'empty-simple': this.simple,
        [`empty-${this.imageSize}`]: typeof this.imageSize === 'string'
      }
    }
  },
  methods: {
    handleAction() {
      this.$emit('action')
    }
  }
}
</script>

<style lang="scss" scoped>
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  
  &.empty-simple {
    padding: 20px;
    
    .empty-image {
      margin-bottom: 8px;
    }
    
    .empty-description {
      font-size: 12px;
      color: #999;
    }
  }
  
  &.empty-small {
    .empty-image {
      width: 60px;
      height: 60px;
    }
  }
  
  &.empty-normal {
    .empty-image {
      width: 100px;
      height: 100px;
    }
  }
  
  &.empty-large {
    .empty-image {
      width: 160px;
      height: 160px;
    }
  }
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-image {
  width: 100px;
  height: 100px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .empty-icon {
    width: 100%;
    height: 100%;
    color: #d9d9d9;
  }
}

.empty-description {
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  
  span {
    display: block;
  }
}

.empty-action {
  margin-top: 8px;
}

// 响应式适配
@media (max-width: 768px) {
  .empty-container {
    padding: 20px 16px;
    
    &.empty-normal {
      .empty-image {
        width: 80px;
        height: 80px;
      }
    }
    
    &.empty-large {
      .empty-image {
        width: 120px;
        height: 120px;
      }
    }
  }
  
  .empty-description {
    font-size: 13px;
  }
}
</style>