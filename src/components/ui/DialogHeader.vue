<script setup lang="ts">
import { cn } from '../../lib/utils';

withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>

<template>
  <div :class="cn('flex items-start justify-between gap-3', $props.class)">
    <slot />
  </div>
</template>
