<script setup lang="ts">
import { DialogTitle as DialogTitlePrimitive } from 'radix-vue';
import { cn } from '../../lib/utils';

withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>

<template>
  <DialogTitlePrimitive :class="cn('text-lg font-bold text-slate-900', $props.class)">
    <slot />
  </DialogTitlePrimitive>
</template>
