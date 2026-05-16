<script setup lang="ts">
import { cn } from '../../lib/utils';

withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>

<template>
  <p :class="cn('text-sm text-slate-500', $props.class)">
    <slot />
  </p>
</template>
