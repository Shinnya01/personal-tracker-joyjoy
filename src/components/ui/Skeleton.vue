<script setup lang="ts">
withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>
<template>
  <div class="ui-skeleton" :class="$props.class" />
</template>

