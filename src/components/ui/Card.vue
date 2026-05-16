<script setup lang="ts">
import { cn } from '../../lib/utils';
withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>
<template>
  <div :class="cn('ui-card', $props.class)">
    <slot />
  </div>
</template>

