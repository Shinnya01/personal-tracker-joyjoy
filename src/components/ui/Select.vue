<script setup lang="ts">
import { cn } from '../../lib/utils';
const model = defineModel<string>({ required: true });
withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>
<template>
  <select v-model="model" :class="cn('ui-input', $props.class)"><slot /></select>
</template>

