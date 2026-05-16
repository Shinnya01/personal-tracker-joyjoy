<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva('ui-btn', {
  variants: {
    variant: {
      default: 'ui-btn-primary',
      secondary: 'ui-btn-secondary',
      ghost: 'ui-btn-ghost',
      danger: 'ui-btn-danger',
    },
    size: {
      default: 'ui-btn-md',
      sm: 'ui-btn-sm',
      lg: 'ui-btn-lg',
      icon: 'ui-btn-icon',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'secondary' | 'ghost' | 'danger';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    class?: string;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'default',
    size: 'default',
    class: '',
    type: 'button',
  },
);
</script>

<template>
  <button :type="props.type" :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)">
    <slot />
  </button>
</template>

