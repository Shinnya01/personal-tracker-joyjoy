<script setup lang="ts">
import { watch } from 'vue';
import { toast } from 'vue-sonner';
import { useUiStore } from '../../stores/uiStore';

const uiStore = useUiStore();

watch(
  () => uiStore.toasts,
  (items) => {
    for (const item of items) {
      if (item.tone === 'success') toast.success(item.text);
      else if (item.tone === 'error') toast.error(item.text);
      else if (item.tone === 'warning') toast.warning(item.text);
      else toast(item.text);
    }
    uiStore.toasts = [];
  },
  { deep: true },
);
</script>

<template>
  <div />
</template>

