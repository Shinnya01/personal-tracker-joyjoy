<script setup lang="ts">
import { cn } from '../../lib/utils';
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'radix-vue';
import { Check, ChevronDown } from 'lucide-vue-next';

interface SelectOption {
  label: string;
  value: string;
}

const model = defineModel<string>({ required: true });

withDefaults(
  defineProps<{
    class?: string;
    placeholder?: string;
    options: readonly SelectOption[];
    align?: 'start' | 'center' | 'end';
  }>(),
  {
    class: '',
    placeholder: 'Select an option',
    align: 'end',
  },
);
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger :class="cn('ui-input inline-flex h-11 w-full items-center justify-between rounded-2xl text-left text-sm', $props.class)">
      <SelectValue :placeholder="$props.placeholder" />
      <ChevronDown :size="16" class="text-slate-500" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        side="bottom"
        :align="$props.align"
        :side-offset="8"
        :align-offset="0"
        :avoid-collisions="false"
        class="z-[120] min-w-[var(--radix-select-trigger-width)] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-soft)]"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in $props.options"
            :key="option.value"
            :value="option.value"
            class="relative flex h-9 cursor-pointer select-none items-center rounded-lg px-8 text-sm text-[var(--text)] outline-none data-[highlighted]:bg-[var(--surface-muted)]"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
            <SelectItemIndicator class="absolute left-2 inline-flex items-center">
              <Check :size="14" class="text-[var(--accent-strong)]" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
