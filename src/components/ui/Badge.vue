<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva('ui-badge', {
  variants: {
    variant: {
      default: 'ui-badge-default',
      accent: 'ui-badge-accent',
      warning: 'ui-badge-warning',
      danger: 'ui-badge-danger',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'accent' | 'warning' | 'danger';
    class?: string;
  }>(),
  {
    variant: 'default',
    class: '',
  },
);
</script>
<template>
  <span :class="cn(badgeVariants({ variant: props.variant }), props.class)"><slot /></span>
</template>

