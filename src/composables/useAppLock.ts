import { computed, ref } from 'vue';
import { pinService } from '../services/pinService';
import { useSettingsStore } from '../stores/settingsStore';

export const useAppLock = () => {
  const settingsStore = useSettingsStore();
  const isUnlocked = ref(!settingsStore.settings.lock.enabled);

  const lockEnabled = computed(() => settingsStore.settings.lock.enabled);
  const canUseBiometric = computed(() => pinService.canUseBiometric());

  const setPin = async (pin: string) => {
    const creds = await pinService.createPin(pin);
    await settingsStore.setLock({ enabled: true, biometricEnabled: false, ...creds });
    isUnlocked.value = true;
  };

  const disableLock = async () => {
    await settingsStore.setLock({ enabled: false, biometricEnabled: false, pinHash: undefined, pinSalt: undefined });
    isUnlocked.value = true;
  };

  const unlockWithPin = async (pin: string) => {
    const ok = await pinService.verifyPin(pin, settingsStore.settings.lock.pinHash, settingsStore.settings.lock.pinSalt);
    isUnlocked.value = ok;
    return ok;
  };

  const lockNow = () => {
    if (settingsStore.settings.lock.enabled) isUnlocked.value = false;
  };

  return { lockEnabled, isUnlocked, canUseBiometric, setPin, disableLock, unlockWithPin, lockNow };
};

