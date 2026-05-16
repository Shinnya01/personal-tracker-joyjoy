<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertCircle, BellRing, CalendarClock, ClockArrowUp } from 'lucide-vue-next';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import { useTrackerStore } from '../stores/trackerStore';

const trackerStore = useTrackerStore();
onMounted(() => { void trackerStore.refresh(); });
const buckets = computed(() => trackerStore.reminderBuckets);

const formatDate = (iso?: string) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-8">
        <CardTitle class="text-4xl leading-tight font-extrabold text-slate-900">Alerts</CardTitle>
        <CardDescription class="mt-3 text-sm text-slate-500">Track overdue and upcoming delivery receipts.</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>

    <div>
      <h2 class="text-base font-bold text-slate-900">Overview</h2>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <Card class="rounded-3xl p-4">
        <p class="text-xs font-medium text-slate-500">Today</p>
        <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ buckets.today.length }}</p>
      </Card>
      <Card class="rounded-3xl p-4">
        <p class="text-xs font-medium text-slate-500">Upcoming</p>
        <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ buckets.upcoming.length }}</p>
      </Card>
      <Card class="rounded-3xl p-4">
        <p class="text-xs font-medium text-rose-500">Alert</p>
        <p class="mt-1 text-2xl font-extrabold text-rose-600">{{ buckets.overdue.length }}</p>
      </Card>
    </div>

    <Card class="rounded-3xl p-4">
      <div class="mb-3 flex items-center gap-2">
        <BellRing :size="16" class="text-rose-500" />
        <h3 class="text-base font-bold text-slate-900">Today</h3>
      </div>
      <div v-if="buckets.today.length" class="grid gap-2">
        <RouterLink v-for="item in buckets.today" :key="item.id" :to="`/trackers/${item.id}`" class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
          <p class="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarClock :size="12" /> {{ formatDate(item.deliveryReceiptDate) }}</p>
        </RouterLink>
      </div>
      <p v-else class="text-sm text-slate-500">No alerts for today.</p>
    </Card>

    <Card class="rounded-3xl p-4">
      <div class="mb-3 flex items-center gap-2">
        <ClockArrowUp :size="16" class="text-amber-500" />
        <h3 class="text-base font-bold text-slate-900">Upcoming</h3>
      </div>
      <div v-if="buckets.upcoming.length" class="grid gap-2">
        <RouterLink v-for="item in buckets.upcoming" :key="item.id" :to="`/trackers/${item.id}`" class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
          <p class="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarClock :size="12" /> {{ formatDate(item.deliveryReceiptDate) }}</p>
        </RouterLink>
      </div>
      <p v-else class="text-sm text-slate-500">No upcoming alerts.</p>
    </Card>

    <Card class="rounded-3xl border border-rose-200/70 p-4">
      <div class="mb-3 flex items-center gap-2">
        <AlertCircle :size="16" class="text-rose-500" />
        <h3 class="text-base font-bold text-rose-700">Alert</h3>
      </div>
      <div v-if="buckets.overdue.length" class="grid gap-2">
        <RouterLink v-for="item in buckets.overdue" :key="item.id" :to="`/trackers/${item.id}`" class="rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
          <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
          <p class="mt-1 flex items-center gap-1 text-xs text-rose-600"><CalendarClock :size="12" /> {{ formatDate(item.deliveryReceiptDate) }}</p>
        </RouterLink>
      </div>
      <p v-else class="text-sm text-slate-500">No overdue alerts.</p>
    </Card>
  </section>
</template>
