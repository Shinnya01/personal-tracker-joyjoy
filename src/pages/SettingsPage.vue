<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { DatabaseBackup, MoonStar, ShieldCheck, Trash2 } from 'lucide-vue-next';
import { useBackup } from '../composables/useBackup';
import { useSettingsStore } from '../stores/settingsStore';
import { backupService } from '../services/backupService';
import { useTrackerStore } from '../stores/trackerStore';
import { ensureSeedData } from '../services/seedService';
import { useAppLock } from '../composables/useAppLock';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import Select from '../components/ui/Select.vue';
import Switch from '../components/ui/Switch.vue';

const backup = useBackup();
const settingsStore = useSettingsStore();
const trackerStore = useTrackerStore();
const lock = useAppLock();
const importMode = ref<'replace' | 'merge'>('replace');
const pinInput = ref('');
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
const resetApp = async () => { await backupService.clearAllData(true); await ensureSeedData(); await settingsStore.load(); await trackerStore.refresh(); };
const savePin = async () => { if (pinInput.value.length < 4) return; await lock.setPin(pinInput.value); pinInput.value = ''; };
const updateReminder = async (next: boolean) => { reminderEnabled.value = next; await settingsStore.setReminderSettings({ ...settingsStore.settings.reminder, enabled: next }); };
</script>

<template>
  <section class="stack stack-lg">
    <Card class="settings-card">
      <h1>Settings</h1>
      <p class="muted">Personalize reminders, security, and backup tools.</p>
      <label class="setting-row"><span><MoonStar :size="14" /> Appearance</span><Select :model-value="'light'" disabled><option value="light">Light (iOS style)</option></Select></label>
      <label class="setting-row setting-toggle"><span>Reminders</span><Switch :model-value="reminderEnabled" @update:model-value="updateReminder" /></label>
      <label class="setting-row"><span>Reminder interval</span><Input type="number" :model-value="String(settingsStore.settings.reminder.intervalMinutes)" @update:model-value="settingsStore.setReminderSettings({ ...settingsStore.settings.reminder, intervalMinutes: Number($event) || 1 })" /></label>
    </Card>

    <Card class="settings-card">
      <h2><ShieldCheck :size="16" /> PIN Lock</h2>
      <p class="muted">PIN-first lock with optional fallback biometric support.</p>
      <Input v-model="pinInput" type="password" placeholder="Enter new PIN" />
      <div class="actions-row"><Button @click="savePin">Set PIN</Button><Button variant="secondary" @click="lock.disableLock">Disable Lock</Button></div>
    </Card>

    <Card class="settings-card">
      <h2><DatabaseBackup :size="16" /> Backup</h2>
      <Button :disabled="backup.isBusy.value" @click="backup.exportJson">Export JSON</Button>
      <Select v-model="importMode"><option value="replace">Replace All</option><option value="merge">Merge by ID</option></Select>
      <input type="file" class="ui-input" accept="application/json" @change="onImport" />
    </Card>

    <Card class="settings-card danger-zone">
      <h2><Trash2 :size="16" /> Danger Zone</h2>
      <div class="actions-row"><Button variant="danger" @click="clearData">Clear Data</Button><Button variant="danger" @click="resetApp">Reset App</Button></div>
    </Card>
  </section>
</template>

