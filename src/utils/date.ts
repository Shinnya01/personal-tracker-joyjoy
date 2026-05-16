export const nowIso = () => new Date().toISOString();

export const createId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const isToday = (iso: string) => {
  const d = new Date(iso);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

export const isOverdue = (iso: string) => new Date(iso).getTime() < Date.now();

