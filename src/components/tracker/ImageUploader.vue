<script setup lang="ts">
import { ImagePlus, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { StoredImage } from '../../types/tracker';
import { useImageProcessor } from '../../composables/useImageProcessor';
import { FALLBACK_IMAGE_DATA_URL } from '../../utils/image';
import { useUiStore } from '../../stores/uiStore';
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';

const props = defineProps<{ trackerId: string; existing?: StoredImage[] }>();
const emit = defineEmits<{ changed: [StoredImage[]]; removeExisting: [string]; processing: [boolean] }>();
const fullscreen = ref<string | null>(null);
const isProcessing = ref(false);
const uploadWarning = ref('');
const existingObjectUrls = ref<Record<string, string>>({});
const uiStore = useUiStore();

const isSupportedImage = (file: File) => {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/i.test(file.name);
};

const { previews, processFiles, removePreview, clear } = useImageProcessor();
const fileInput = ref<HTMLInputElement | null>(null);

const rebuildExistingUrls = () => {
  Object.values(existingObjectUrls.value).forEach((url) => URL.revokeObjectURL(url));
  const next: Record<string, string> = {};
  for (const img of props.existing ?? []) {
    next[img.id] = URL.createObjectURL(img.blob);
  }
  existingObjectUrls.value = next;
};

watch(() => props.existing, rebuildExistingUrls, { immediate: true, deep: true });

onBeforeUnmount(() => {
  clear();
  Object.values(existingObjectUrls.value).forEach((url) => URL.revokeObjectURL(url));
});

const existingWithUrls = computed(() =>
  (props.existing ?? []).map((img) => ({ ...img, url: existingObjectUrls.value[img.id] ?? FALLBACK_IMAGE_DATA_URL })),
);

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
      uiStore.pushToast({
        tone: 'warning',
        text: `Image read failed for ${result.failed.length} file(s). Those files were skipped.`,
      });
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

const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = FALLBACK_IMAGE_DATA_URL;
};
</script>

<template>
  <Card class="grid gap-3 rounded-3xl p-5">
    <div class="flex items-center gap-2 text-base font-semibold text-slate-900">
      <ImagePlus :size="18" class="text-rose-500" />
      Images
    </div>
    <p class="text-sm text-slate-500">You can add multiple images.</p>
    <p v-if="uploadWarning" class="text-sm text-[var(--danger)]">{{ uploadWarning }}</p>
    <input ref="fileInput" type="file" accept="image/*,.heic,.heif" multiple class="hidden" :disabled="isProcessing" @change="onFiles" />

    <div class="image-grid image-grid-large">
      <button
        type="button"
        class="grid h-[106px] w-full place-items-center rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/20 text-rose-500 transition hover:bg-rose-100/40 disabled:opacity-60"
        :disabled="isProcessing"
        aria-label="Add more images"
        @click="openPicker"
      >
        <ImagePlus :size="24" />
      </button>

      <div v-for="img in existingWithUrls" :key="img.id" class="image-item relative">
        <img :src="img.url" alt="existing" @click="fullscreen = img.url" @error="onImageError" />
        <button
          type="button"
          class="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm"
          aria-label="Remove image"
          @click="emit('removeExisting', img.id)"
        >
          <X :size="14" />
        </button>
      </div>

      <div v-for="preview in previews" :key="preview.id" class="image-item relative">
        <img :src="preview.url" alt="preview" @click="fullscreen = preview.url" @error="onImageError" />
        <button
          type="button"
          class="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm"
          aria-label="Remove image"
          @click="removePreview(preview.id)"
        >
          <X :size="14" />
        </button>
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
    <img :src="fullscreen" class="fullscreen-image" alt="fullscreen preview" @click.stop @error="onImageError" />
  </div>
</template>
