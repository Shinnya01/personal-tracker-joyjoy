<script setup lang="ts">
import { DialogRoot } from 'radix-vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [boolean] }>();
</script>

<template>
  <DialogRoot :open="props.open" @update:open="(value) => emit('update:open', value)">
    <slot />
  </DialogRoot>
</template>
