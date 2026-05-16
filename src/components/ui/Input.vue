<script setup lang="ts">
import { cn } from '../../lib/utils';
const model = defineModel<string>({ required: true });
withDefaults(defineProps<{ class?: string; type?: string; placeholder?: string }>(), { class: '', type: 'text', placeholder: '' });
</script>
<template>
  <input v-model="model" :type="$props.type" :placeholder="$props.placeholder" :class="cn('ui-input', $props.class)" />
</template>

