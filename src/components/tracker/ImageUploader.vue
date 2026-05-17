<script setup lang="ts">
import { ImagePlus, X } from 'lucide-vue-next';
import { ref } from 'vue';
import type { StoredImage } from '../../types/tracker';
import { useImageProcessor } from '../../composables/useImageProcessor';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';

const props = defineProps<{ trackerId: string; existing?: StoredImage[] }>();
const emit = defineEmits<{ changed: [StoredImage[]]; removeExisting: [string]; processing: [boolean] }>();
const fullscreen = ref<string | null>(null);
const isProcessing = ref(false);
const uploadWarning = ref('');

const isSupportedImage = (file: File) => {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/i.test(file.name);
};

const { previews, processFiles, removePreview } = useImageProcessor();
const fileInput = ref<HTMLInputElement | null>(null);

const createObjectUrl = (blob: Blob) => window.URL.createObjectURL(blob);

const onFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  const unsupported = files.filter((file) => !isSupportedImage(file));
  const supported = files.filter((file) => isSupportedImage(file));

  isProcessing.value = true;
  emit('processing', true);
  uploadWarning.value = '';
  try {
    if (unsupported.length) {
      const names = unsupported.slice(0, 2).map((f) => f.name).join(', ');
      const more = unsupported.length > 2 ? ` and ${unsupported.length - 2} more` : '';
      uploadWarning.value = `Unsupported file type (${names}${more}). Please upload image files only.`;
    }
    const transfer = new DataTransfer();
    supported.forEach((file) => transfer.items.add(file));
    const result = await processFiles(props.trackerId, transfer.files);
    if (result.failed.length) {
      const names = result.failed.slice(0, 2).join(', ');
      const more = result.failed.length > 2 ? ` and ${result.failed.length - 2} more` : '';
      uploadWarning.value = `Some images could not be added (${names}${more}). If this is HEIC/HEIF, your browser may not support decoding it.`;
    }
    emit('changed', previews.value.map((p) => p.file));
  } finally {
    isProcessing.value = false;
    emit('processing', false);
    input.value = '';
  }
};

const openPicker = () => {
  fileInput.value?.click();
};
</script>

<template>
  <Card class="grid gap-3 rounded-3xl p-5">
    <div class="flex items-center gap-2 text-base font-semibold text-slate-900">
      <ImagePlus :size="18" class="text-rose-500" />
      Images
    </div>
    <div class="relative rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/20 p-5 text-center">
      <div v-if="isProcessing" class="upload-processing-overlay">
        <div class="upload-processing-spinner" />
        <p class="text-xs font-semibold text-[var(--accent-strong)]">Processing images...</p>
      </div>
      <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-500">
        <ImagePlus :size="24" />
      </div>
      <p class="mt-3 text-xl font-bold text-slate-900">Add images</p>
      <p class="mt-1 text-sm text-slate-500">Tap to browse or drag and drop</p>
      <Button type="button" size="sm" :disabled="isProcessing" class="mt-3 rounded-xl border-none bg-rose-100 px-5 py-1.5 text-sm font-semibold text-rose-600 shadow-none disabled:opacity-60" @click="openPicker">
        Browse files
      </Button>
      <input ref="fileInput" type="file" accept="image/*,.heic,.heif" multiple class="hidden" :disabled="isProcessing" @change="onFiles" />
    </div>
    <p class="text-sm text-slate-500">You can add multiple images.</p>
    <p v-if="uploadWarning" class="text-sm text-[var(--danger)]">{{ uploadWarning }}</p>

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

  <div v-if="fullscreen" class="overlay modal-overlay" @click.self="fullscreen = null">
    <Button
      type="button"
      size="icon"
      variant="secondary"
      class="modal-close-button"
      aria-label="Close fullscreen image"
      @click="fullscreen = null"
    >
      <X :size="18" />
    </Button>
    <img :src="fullscreen" class="fullscreen-image" alt="fullscreen preview" @click.stop />
  </div>
</template>

