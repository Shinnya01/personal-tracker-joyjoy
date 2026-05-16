<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { CheckCircle2, CircleDashed, ListChecks, Pen, Plus, PlusCircle, Trash2 } from 'lucide-vue-next';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import Button from '../components/ui/Button.vue';
import { useTrackerStore } from '../stores/trackerStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { ActivityLog } from '../types/tracker';

const trackerStore = useTrackerStore();
const settingsStore = useSettingsStore();
const now = ref(new Date());
let greetingTimer: number | null = null;

onMounted(() => {
  void trackerStore.refresh();
  greetingTimer = window.setInterval(() => {
    now.value = new Date();
  }, 30000);
});

onUnmounted(() => {
  if (greetingTimer !== null) window.clearInterval(greetingTimer);
});

const greetingText = computed(() => {
  const hour = now.value.getHours();
  const dayGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const name = settingsStore.settings.displayName?.trim();
  return name ? `${dayGreeting}, ${name}` : dayGreeting;
});

const overviewItems = computed(() => [
  { label: 'Total', value: trackerStore.stats.total, icon: ListChecks, color: 'pink' },
  { label: 'This Month', value: trackerStore.stats.pending, icon: CircleDashed, color: 'orange' },
]);

const activityText = (activity: ActivityLog) => {
  if (activity.type === 'created') {
    const title = activity.message.replace(/^Created tracker:\s*/i, '').trim();
    return `You created "${title}"`;
  }
  return activity.message;
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const activityIconClass = (type: ActivityLog['type']) => {
  if (type === 'created') return 'text-green-500';
  if (type === 'updated') return 'text-amber-500';
  if (type === 'deleted') return 'text-red-500';
  return 'text-slate-400';
};
</script>

<template>
  <section class="flex flex-col gap-6">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-5">
        <p class="text-sm font-semibold text-[var(--accent-strong)]">{{ greetingText }}</p>
        <CardTitle class="mt-2 text-4xl leading-tight font-extrabold text-slate-900">Let’s make today count.</CardTitle>
        <CardDescription class="mt-3 text-sm text-slate-500">Stay organized and keep everything on track.</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>

    <div>
      <h2 class="text-base font-bold text-slate-900">Overview</h2>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div v-for="item in overviewItems" :key="item.label">
        <Card class="rounded-3xl border border-white/70 bg-white/90 p-5 backdrop-blur-sm">
          <div
            class="mb-4 grid h-14 w-14 place-items-center rounded-2xl"
            :class="item.color === 'pink' ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'bg-amber-100 text-amber-500'"
          >
            <component :is="item.icon" :size="22" />
          </div>
          <p class="text-sm text-slate-500">{{ item.label }}</p>
          <h3 class="text-3xl font-extrabold text-slate-900">{{ item.value }}</h3>
        </Card>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3">
      <h2 class="text-base font-bold text-slate-900">Recent Activity</h2>
      <RouterLink to="/trackers" class="text-sm font-semibold text-[var(--accent-strong)]">See all</RouterLink>
    </div>

    <div v-if="trackerStore.activities.length" class="stack">
      <Card
        v-for="activity in trackerStore.activities.slice(0, 3)"
        :key="activity.id"
        class="rounded-3xl p-4"
      >
        <div class="flex items-center gap-3 py-1.5">
          <CheckCircle2
            v-if="activity.type === 'created'"
            :size="24"
            :class="['shrink-0 self-center', activityIconClass(activity.type)]"
          />
          <Pen
            v-else-if="activity.type === 'updated'"
            :size="24"
            :class="['shrink-0 self-center', activityIconClass(activity.type)]"
          />
          <Trash2
            v-else-if="activity.type === 'deleted'"
            :size="24"
            :class="['shrink-0 self-center', activityIconClass(activity.type)]"
          />
          <div>
            <p class="text-sm font-medium text-slate-900">{{ activityText(activity) }}</p>
            <p class="text-xs text-slate-500">{{ timeAgo(activity.createdAt) }}</p>
          </div>
        </div>
      </Card>
    </div>

    <Card v-else class="rounded-3xl p-4">
      <div class="text-center text-sm text-slate-500">No recent activity</div>
    </Card>

    <div>
      <h2 class="text-base font-bold text-slate-900">Quick Action</h2>
    </div>

    <Card class="flex items-center justify-between gap-3 rounded-3xl p-6">
      <div class="flex items-center gap-3">
        <div class="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <PlusCircle :size="20" />
        </div>
        <div>
        <h3 class="text-base font-bold text-slate-900">Quick Add Tracker</h3>
        <p class="text-sm text-slate-500">Create a new tracker in seconds</p>
        </div>
      </div>
      <RouterLink to="/trackers/new">
        <Button size="lg" class="!px-4 !py-2"><Plus/> Add</Button>
      </RouterLink>
    </Card>
  </section>
</template>
