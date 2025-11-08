<template>
  <div v-if="show" class="image-preview-overlay" @click="$emit('close')">
    <div class="image-preview-container" @click.stop>
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
const props = defineProps<{ show: boolean }>();
const emit = defineEmits(['close']);
</script>
<style scoped>
.image-preview-overlay { /* 样式可复用原有 */ }
</style> 