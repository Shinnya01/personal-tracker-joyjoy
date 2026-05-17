const lockOwners = new Set<string>();

const applyLock = () => {
  const shouldLock = lockOwners.size > 0;
  document.body.style.overflow = shouldLock ? 'hidden' : '';
  document.documentElement.style.overflow = shouldLock ? 'hidden' : '';
};

export const acquireGlobalScrollLock = (ownerId: string) => {
  lockOwners.add(ownerId);
  applyLock();
};

export const releaseGlobalScrollLock = (ownerId: string) => {
  lockOwners.delete(ownerId);
  applyLock();
};
