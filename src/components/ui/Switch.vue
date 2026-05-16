<script setup lang="ts">
const model = defineModel<boolean>({ required: true });
</script>
<template>
  <button class="ui-switch" :data-checked="model" type="button" @click="model = !model">
    <span class="ui-switch-thumb" />
  </button>
</template>

