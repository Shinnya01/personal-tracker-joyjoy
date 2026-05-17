const lockOwners = new Set<string>();

const applyLock = () => {
  const shouldLock = lockOwners.size > 0;
  document.body.style.overflow = shouldLock ? 'hidden' : '';
  document.documentElement.style.overflow = shouldLock ? 'hidden' : '';

  if (!shouldLock) {
    // Defensive recovery for mobile/PWA cases where modal lifecycle may leave
    // global hit-testing disabled after close.
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = '';
    }
    if (document.documentElement.style.pointerEvents === 'none') {
      document.documentElement.style.pointerEvents = '';
    }
  }
};

export const acquireGlobalScrollLock = (ownerId: string) => {
  lockOwners.add(ownerId);
  applyLock();
};

export const releaseGlobalScrollLock = (ownerId: string) => {
  lockOwners.delete(ownerId);
  applyLock();
};
