<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { DatabaseBackup, MoonStar, RefreshCw, Trash2 } from 'lucide-vue-next';
import { useBackup } from '../composables/useBackup';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';
import { backupService } from '../services/backupService';
import { useTrackerStore } from '../stores/trackerStore';
import { useAuthStore } from '../stores/authStore';
import { hasSupabaseConfig } from '../lib/supabase';
import Card from '../components/ui/Card.vue';
import CardHeader from '../components/ui/CardHeader.vue';
import CardTitle from '../components/ui/CardTitle.vue';
import CardDescription from '../components/ui/CardDescription.vue';
import CardContent from '../components/ui/CardContent.vue';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import Select from '../components/ui/Select.vue';
import Switch from '../components/ui/Switch.vue';
import { useManualSync } from '../composables/useManualSync';

const backup = useBackup();
const router = useRouter();
const settingsStore = useSettingsStore();
const uiStore = useUiStore();
const trackerStore = useTrackerStore();
const authStore = useAuthStore();
const { isSyncing, syncNow } = useManualSync();
const importMode = ref<'replace' | 'merge'>('replace');
const reminderEnabled = ref(false);
const selectedBackupFile = ref<File | null>(null);
const darkMode = ref<'system' | 'light' | 'dark'>('system');
const username = ref('');
const password = ref('');
const DARK_MODE_OPTIONS = [
  { label: 'System (Default)', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
] as const;
const IMPORT_MODE_OPTIONS = [
  { label: 'Replace All', value: 'replace' },
  { label: 'Merge by ID', value: 'merge' },
] as const;

onMounted(async () => {
  await authStore.init();
  await settingsStore.load();
  reminderEnabled.value = settingsStore.settings.reminder.enabled;
  darkMode.value = settingsStore.settings.darkMode;
});

const onBackupFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  selectedBackupFile.value = input.files?.[0] ?? null;
  if (selectedBackupFile.value) {
    uiStore.pushToast({
      tone: 'info',
      text: `Selected backup file: ${selectedBackupFile.value.name}`,
    });
  }
};

const exportBackup = async () => {
  try {
    await backup.exportJson();
    uiStore.pushToast({
      tone: 'success',
      text: 'Backup exported successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export backup.';
    uiStore.pushToast({
      tone: 'error',
      text: `Export failed: ${message}`,
    });
  }
};

const importBackup = async () => {
  const file = selectedBackupFile.value;
  if (!file) return;

  try {
    await backup.importJson(file, importMode.value);
    await trackerStore.refresh();
    uiStore.pushToast({
      tone: 'success',
      text: `Backup imported successfully (${importMode.value === 'replace' ? 'Replace All' : 'Merge by ID'}).`,
    });
    selectedBackupFile.value = null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import backup.';
    uiStore.pushToast({
      tone: 'error',
      text: `Import failed: ${message}`,
    });
  }
};

const clearData = async () => {
  const ok = await uiStore.askConfirm('Clear data', 'This will remove all trackers, images, and activity logs.');
  if (!ok) return;
  try {
    await backupService.clearAllData(false);
    await trackerStore.refresh();
    uiStore.pushToast({
      tone: 'success',
      text: 'All tracker data has been cleared.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to clear data.';
    uiStore.pushToast({
      tone: 'error',
      text: `Clear data failed: ${message}`,
    });
  }
};

const resetApp = async () => {
  const ok = await uiStore.askConfirm('Reset app', 'This will remove all app data including settings. This cannot be undone.');
  if (!ok) return;
  try {
    await backupService.clearAllData(true);
    await settingsStore.load();
    await trackerStore.refresh();
    uiStore.pushToast({
      tone: 'success',
      text: 'App reset complete.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset app.';
    uiStore.pushToast({
      tone: 'error',
      text: `Reset failed: ${message}`,
    });
  }
};
const updateReminder = async (next: boolean) => { reminderEnabled.value = next; await settingsStore.setReminderSettings({ ...settingsStore.settings.reminder, enabled: next }); };
const updateDarkMode = async (value: 'system' | 'light' | 'dark') => {
  darkMode.value = value;
  await settingsStore.setDarkMode(value);
};

const signIn = async () => {
  try {
    await authStore.signIn(username.value.trim(), password.value);
    uiStore.pushToast({ tone: 'success', text: 'Signed in.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed.';
    uiStore.pushToast({ tone: 'error', text: message });
  }
};

const signUp = async () => {
  try {
    const result = await authStore.signUp(username.value.trim(), password.value);
    if (result.signedIn) {
      uiStore.pushToast({ tone: 'success', text: 'Account created and signed in.' });
      return;
    }
    uiStore.pushToast({ tone: 'success', text: 'Account created. Check your email if confirmation is required.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign up failed.';
    uiStore.pushToast({ tone: 'error', text: message });
  }
};

const signOut = async () => {
  await authStore.signOut();
  uiStore.pushToast({ tone: 'success', text: 'Signed out.' });
  await router.replace('/login');
};
</script>

<template>
  <section class="flex flex-col gap-5">
    <Card class="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-white to-rose-50/50 shadow-[var(--shadow-soft)]">
      <CardHeader class="relative z-10 p-8">
        <div class="flex items-center justify-between gap-3">
          <CardTitle class="text-4xl leading-tight font-extrabold text-slate-900">Settings</CardTitle>
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
            v-model="darkMode"
            :options="DARK_MODE_OPTIONS"
            class="h-11 rounded-2xl text-sm"
            @update:model-value="(value) => updateDarkMode(value as 'system' | 'light' | 'dark')"
          />
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
        <CardTitle class="flex items-center gap-2 text-lg">Cloud Sync (Supabase)</CardTitle>
        <CardDescription class="text-sm text-slate-500">Local Dexie remains primary. Sync only runs when online and logged in.</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-3">
        <p class="text-xs text-slate-500">Config: {{ hasSupabaseConfig ? 'Ready' : 'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' }}</p>
        <p class="text-xs text-slate-500">Status: {{ authStore.isLoggedIn ? `Logged in as ${(authStore.user?.email ?? '').split('@')[0]}` : 'Logged out' }}</p>
        <template v-if="!authStore.isLoggedIn">
          <Input v-model="username" type="text" placeholder="Username" class="h-11 rounded-2xl text-sm" />
          <Input v-model="password" type="password" placeholder="Password" class="h-11 rounded-2xl text-sm" />
          <div class="flex gap-2">
            <Button :disabled="authStore.isLoading || !hasSupabaseConfig" @click="signIn">Login</Button>
            <Button variant="secondary" :disabled="authStore.isLoading || !hasSupabaseConfig" @click="signUp">Signup</Button>
          </div>
        </template>
        <template v-else>
          <Button variant="secondary" @click="signOut">Logout</Button>
        </template>
      </CardContent>
    </Card>

    <Card class="rounded-3xl">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-lg"><DatabaseBackup :size="18" class="text-rose-500" /> Backup</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-3">
        <Button :disabled="backup.isBusy.value" @click="exportBackup">Export JSON</Button>
        <Select v-model="importMode" :options="IMPORT_MODE_OPTIONS" class="h-11 rounded-2xl text-sm" />
        <input
          type="file"
          accept="application/json"
          class="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-rose-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-rose-600"
          @change="onBackupFileChange"
        />
        <Button
          v-if="selectedBackupFile"
          :disabled="backup.isBusy.value || !selectedBackupFile"
          @click="importBackup"
        >
          Import Backup
        </Button>
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
