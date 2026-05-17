<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import { useUiStore } from '../../stores/uiStore';
import { acquireGlobalScrollLock, releaseGlobalScrollLock } from '../../composables/useGlobalScrollLock';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';

const uiStore = useUiStore();

watch(
  () => uiStore.confirm.open,
  (open) => {
    if (open) acquireGlobalScrollLock('confirm-dialog');
    else releaseGlobalScrollLock('confirm-dialog');
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  releaseGlobalScrollLock('confirm-dialog');
});
</script>

<template>
  <div v-if="uiStore.confirm.open" class="overlay">
    <Card class="dialog">
      <h3>{{ uiStore.confirm.title }}</h3>
      <p class="muted">{{ uiStore.confirm.message }}</p>
      <div class="dialog-actions">
        <Button variant="secondary" @click="uiStore.resolveConfirm(false)">Cancel</Button>
        <Button variant="danger" @click="uiStore.resolveConfirm(true)">Confirm</Button>
      </div>
    </Card>
  </div>
</template>
