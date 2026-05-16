<script setup lang="ts">
import { cn } from '../../lib/utils';
const model = defineModel<string>({ required: true });
withDefaults(defineProps<{ class?: string; placeholder?: string }>(), { class: '', placeholder: '' });
</script>
<template>
  <textarea v-model="model" :placeholder="$props.placeholder" :class="cn('ui-input ui-textarea', $props.class)" />
</template>

