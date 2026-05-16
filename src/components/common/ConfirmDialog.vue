<script setup lang="ts">
import { useUiStore } from '../../stores/uiStore';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';

const uiStore = useUiStore();
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

