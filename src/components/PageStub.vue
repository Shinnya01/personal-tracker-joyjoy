<script setup lang="ts">
defineProps<{ title: string; description: string }>();
</script>

<template>
  <section class="page">
    <h1 class="page-title">{{ title }}</h1>
    <p class="page-description">{{ description }}</p>
  </section>
</template>
