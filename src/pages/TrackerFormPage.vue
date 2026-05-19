<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RefreshCw } from 'lucide-vue-next';
import TrackerForm from '../components/tracker/TrackerForm.vue';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import { useTrackerStore } from '../stores/trackerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';
import { imageRepo } from '../db/repositories/imageRepo';
import { trackerService } from '../services/trackerService';
import type { StoredImage } from '../types/tracker';
import { useManualSync } from '../composables/useManualSync';

const route = useRoute();
const router = useRouter();
const trackerStore = useTrackerStore();
const settingsStore = useSettingsStore();
const uiStore = useUiStore();
const { authStore, isSyncing, syncNow } = useManualSync();
const existingImages = ref<StoredImage[]>([]);
const removedExistingIds = ref<string[]>([]);
const isSubmitting = ref(false);

const trackerId = computed(() => (route.params.id ? String(route.params.id) : null));
const tracker = computed(() => (trackerId.value ? trackerStore.getById(trackerId.value) : undefined));

onMounted(async () => {
  await settingsStore.load();
  await trackerStore.refresh();
  if (trackerId.value) existingImages.value = await imageRepo.listByTrackerId(trackerId.value);
});

const FIXED_DUE_DAY = 5;
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

const showDueAlertsNow = () => {
  if (!settingsStore.settings.reminder.enabled) return;

  const nowDate = new Date();
  const todayDay = nowDate.getDate();
  if (todayDay < FIXED_DUE_DAY) return;

  const thisMonthKey = monthKey(nowDate);
  const isLate = todayDay > FIXED_DUE_DAY;
  const due = trackerStore.trackers.filter((item) => {
    if (!item.deliveryReceiptDate) return false;
    const base = new Date(item.deliveryReceiptDate);
    if (Number.isNaN(base.getTime())) return false;
    if (monthIndex(nowDate) <= monthIndex(base)) return false;
    return true;
  });

  for (const item of due) {
    const key = `${item.id}:${thisMonthKey}`;
    if (settingsStore.settings.dismissedReminderMonths?.[key]) continue;
    uiStore.showReminderAlert({
      title: isLate ? 'Late Reminder' : 'Reminder Due Today',
      message: 'Please take a picture and sent it',
      trackerId: item.id,
      monthKey: thisMonthKey,
      dedupeKey: key,
    });
  }
};

const handleSubmit = async (payload: any) => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  const { images, keepImageIds, ...base } = payload;
  try {
    let actionLabel: 'created' | 'updated' = 'created';
    if (trackerId.value) {
      actionLabel = 'updated';
      const updated = await trackerStore.upsertTracker(
        { ...base, images: [...keepImageIds, ...images.map((img: StoredImage) => img.id)] },
        trackerId.value,
      );
      if (!updated) return;
      await trackerService.saveImages(trackerId.value, images);
      if (removedExistingIds.value.length) {
        await imageRepo.bulkDelete(removedExistingIds.value);
      }
    } else {
      const created = await trackerStore.upsertTracker({ ...base, images: images.map((img: StoredImage) => img.id) });
      if (!created) return;
      await trackerService.saveImages(created.id, images);
      window.dispatchEvent(new Event('tracker-created'));
    }
    showDueAlertsNow();
    uiStore.pushToast({
      tone: 'success',
      text: actionLabel === 'created' ? 'Tracker created successfully.' : 'Tracker updated successfully.',
    });
    await router.push('/trackers');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed.';
    uiStore.pushToast({ tone: 'error', text: `Unable to save tracker: ${message}` });
  } finally {
    isSubmitting.value = false;
  }
};

const removeExisting = async (imageId: string) => {
  existingImages.value = existingImages.value.filter((image) => image.id !== imageId);
  removedExistingIds.value.push(imageId);
};
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-5">
        <div class="flex items-center justify-between gap-3">
          <CardTitle class="mt-2 text-4xl leading-tight font-extrabold text-slate-900">{{ trackerId ? 'Update tracker' : 'Create a tracker' }}</CardTitle>
          <Button
            v-if="authStore.isLoggedIn"
            size="sm"
            variant="secondary"
            class="rounded-xl"
            :disabled="isSyncing"
            @click="syncNow"
          >
            <RefreshCw :size="14" :class="{ 'animate-spin': isSyncing }" />
            {{ isSyncing ? 'Syncing' : 'Sync' }}
          </Button>
        </div>
      <CardDescription class="mt-3 text-sm text-slate-500">{{ trackerId ? 'Update details, receipt date, and images.' : 'Add details, receipt date, and images.' }}</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>
    <TrackerForm :tracker="tracker" :existing-images="existingImages" :is-submitting="isSubmitting" @submit="handleSubmit" @remove-existing="removeExisting" />
  </section>
</template>
