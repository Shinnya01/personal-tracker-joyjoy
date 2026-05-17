<script setup lang="ts">
import { DialogContent as DialogContentPrimitive, DialogOverlay, DialogPortal } from 'radix-vue';
import { cn } from '../../lib/utils';

withDefaults(defineProps<{ class?: string; overlayClass?: string }>(), { class: '', overlayClass: '' });
</script>

<template>
  <DialogPortal>
    <DialogOverlay :class="cn('fixed inset-0 z-[140] bg-black/35 backdrop-blur-[1px]', $props.overlayClass)" />
    <DialogContentPrimitive
      :class="
        cn(
          'fixed left-1/2 top-1/2 z-[141] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] outline-none',
          $props.class,
        )
      "
    >
      <slot />
    </DialogContentPrimitive>
  </DialogPortal>
</template>
