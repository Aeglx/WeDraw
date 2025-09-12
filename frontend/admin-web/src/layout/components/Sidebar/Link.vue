<template>
  <component :is="linkProps.is" v-bind="linkProps">
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { isExternal } from '@/utils/validate'

const props = defineProps({
  to: {
    type: String,
    required: true
  }
})

const linkProps = computed(() => {
  if (isExternal(props.to)) {
    return {
      is: 'a',
      href: props.to,
      target: '_blank',
      rel: 'noopener'
    }
  }
  return {
    is: 'router-link',
    to: props.to
  }
})
</script>