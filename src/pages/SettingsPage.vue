<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { DatabaseBackup, MoonStar, Trash2 } from 'lucide-vue-next';
import { useBackup } from '../composables/useBackup';
import { useSettingsStore } from '../stores/settingsStore';
import { backupService } from '../services/backupService';
import { useTrackerStore } from '../stores/trackerStore';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import CardContent from '../components/ui/CardContent.vue';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import Select from '../components/ui/Select.vue';
import Switch from '../components/ui/Switch.vue';

const backup = useBackup();
const settingsStore = useSettingsStore();
const trackerStore = useTrackerStore();
const importMode = ref<'replace' | 'merge'>('replace');
const reminderEnabled = ref(false);

onMounted(async () => {
  await settingsStore.load();
  reminderEnabled.value = settingsStore.settings.reminder.enabled;
});

const onImport = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await backup.importJson(file, importMode.value);
  await trackerStore.refresh();
};

const clearData = async () => { await backupService.clearAllData(false); await trackerStore.refresh(); };
const resetApp = async () => { await backupService.clearAllData(true); await settingsStore.load(); await trackerStore.refresh(); };
const updateReminder = async (next: boolean) => { reminderEnabled.value = next; await settingsStore.setReminderSettings({ ...settingsStore.settings.reminder, enabled: next }); };
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-8">
        <CardTitle class="text-4xl leading-tight font-extrabold text-slate-900">Settings</CardTitle>
        <CardDescription class="mt-3 text-sm text-slate-500">Personalize reminders and backup tools.</CardDescription>
      </CardHeader>
      <div class="pointer-events-none absolute inset-0 bg-radial-[at_85%_5%] from-rose-300/30 via-transparent to-transparent"></div>
    </Card>

    <Card class="rounded-3xl">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-lg"><MoonStar :size="18" class="text-rose-500" /> Preferences</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-4">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-slate-700">Appearance</span>
          <Select
            :model-value="settingsStore.settings.darkMode"
            class="h-11 rounded-2xl text-sm"
            @update:model-value="(value) => settingsStore.setDarkMode((value as 'light' | 'dark'))"
          >
            <option value="light">Light (iOS style)</option>
            <option value="dark">Dark</option>
          </Select>
        </label>
        <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <span class="text-sm font-medium text-slate-800">Reminders</span>
          <Switch :model-value="reminderEnabled" @update:model-value="updateReminder" />
        </label>
        <label class="grid gap-2">
          <span class="text-sm font-medium text-slate-700">Reminder interval (minutes)</span>
          <Input
            type="number"
            class="h-11 rounded-2xl text-sm"
            :model-value="String(settingsStore.settings.reminder.intervalMinutes)"
            @update:model-value="settingsStore.setReminderSettings({ ...settingsStore.settings.reminder, intervalMinutes: Number($event) || 1 })"
          />
        </label>
      </CardContent>
    </Card>

    <Card class="rounded-3xl">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-lg"><DatabaseBackup :size="18" class="text-rose-500" /> Backup</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-3">
        <Button :disabled="backup.isBusy.value" @click="backup.exportJson">Export JSON</Button>
        <Select v-model="importMode" class="h-11 rounded-2xl text-sm">
          <option value="replace">Replace All</option>
          <option value="merge">Merge by ID</option>
        </Select>
        <input
          type="file"
          accept="application/json"
          class="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-rose-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-rose-600"
          @change="onImport"
        />
      </CardContent>
    </Card>

    <Card class="rounded-3xl border border-rose-200/60">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-lg text-rose-700"><Trash2 :size="18" /> Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-2">
          <Button variant="danger" @click="clearData">Clear Data</Button>
          <Button variant="danger" @click="resetApp">Reset App</Button>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
