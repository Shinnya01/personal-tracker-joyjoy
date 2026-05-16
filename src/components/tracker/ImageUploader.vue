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
const fileInput = ref<HTMLInputElement | null>(null);

const createObjectUrl = (blob: Blob) => window.URL.createObjectURL(blob);

const onFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  await processFiles(props.trackerId, input.files);
  emit('changed', previews.value.map((p) => p.file));
};

const openPicker = () => {
  fileInput.value?.click();
};
</script>

<template>
  <Card class="grid gap-4 rounded-4xl p-6">
    <div class="flex items-center gap-2 text-lg font-semibold text-slate-900">
      <ImagePlus :size="20" class="text-rose-500" />
      Images
    </div>
    <div class="rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50/20 p-6 text-center">
      <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-rose-500">
        <ImagePlus :size="30" />
      </div>
      <p class="mt-4 text-2xl font-bold text-slate-900">Add images</p>
      <p class="mt-1 text-lg text-slate-500">Tap to browse or drag and drop</p>
      <Button type="button" size="sm" class="mt-4 rounded-2xl border-none bg-rose-100 px-6 py-2 text-base font-semibold text-rose-600 shadow-none" @click="openPicker">
        Browse files
      </Button>
      <input ref="fileInput" type="file" accept="image/*" capture="environment" multiple class="hidden" @change="onFiles" />
    </div>
    <p class="text-base text-slate-500">You can add multiple images.</p>

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

