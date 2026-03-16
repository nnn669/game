<template>
  <div class="sub-page">
    <div class="sub-header">
      <button class="back-btn" @click="$emit('back')">← 返回</button>
      <span class="sub-title">{{ title }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup>
defineProps({ title: String })
defineEmits(['back'])
</script>
