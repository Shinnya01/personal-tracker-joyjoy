<script setup lang="ts">
import { ImagePlus } from 'lucide-vue-next';
import { ref } from 'vue';
import type { StoredImage } from '../../types/tracker';
import { useImageProcessor } from '../../composables/useImageProcessor';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';

const props = defineProps<{ trackerId: string; existing?: StoredImage[] }>();
const emit = defineEmits<{ changed: [StoredImage[]]; removeExisting: [string] }>();
const fullscreen = ref<string | null>(null);

const { previews, processFiles, removePreview } = useImageProcessor();

const createObjectUrl = (blob: Blob) => window.URL.createObjectURL(blob);

const onFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  await processFiles(props.trackerId, input.files);
  emit('changed', previews.value.map((p) => p.file));
};
</script>

<template>
  <Card class="upload-card">
    <label class="form-label upload-zone">
      <span><ImagePlus :size="14" /> Images</span>
      <input type="file" accept="image/*" capture="environment" multiple class="ui-input" @change="onFiles" />
    </label>

    <div class="image-grid image-grid-large">
      <div v-for="img in existing" :key="img.id" class="image-item">
        <img :src="createObjectUrl(img.blob)" alt="existing" @click="fullscreen = createObjectUrl(img.blob)" />
        <Button size="sm" variant="secondary" @click="emit('removeExisting', img.id)">Remove</Button>
      </div>

      <div v-for="preview in previews" :key="preview.id" class="image-item">
        <img :src="preview.url" alt="preview" @click="fullscreen = preview.url" />
        <Button size="sm" variant="secondary" @click="removePreview(preview.id)">Remove</Button>
      </div>
    </div>
  </Card>

  <div v-if="fullscreen" class="overlay" @click="fullscreen = null">
    <img :src="fullscreen" class="fullscreen-image" alt="fullscreen preview" />
  </div>
</template>

