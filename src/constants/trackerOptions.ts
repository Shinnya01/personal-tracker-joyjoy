export const COMPANY_OPTIONS = [
  { label: 'BIG GOALS CORPORATION', value: 'BIG GOALS CORPORATION' },
  { label: 'BIG GOALS PETROLEUM TRADING', value: 'BIG GOALS PETROLEUM TRADING' },
  { label: 'POSITIVE BUILDERS', value: 'POSITIVE BUILDERS' },
] as const;

export const CATEGORY_OPTIONS = [
  { label: 'Aggregates', value: 'Aggregates' },
  { label: 'Diesel', value: 'Diesel' },
  { label: 'Spareparts', value: 'Spareparts' },
  { label: 'Ready Mix Concrete', value: 'Ready Mix Concrete' },
] as const;

export const COMPANY_FILTER_OPTIONS = [
  { label: 'All Companies', value: 'all' },
  ...COMPANY_OPTIONS,
] as const;

export const CATEGORY_FILTER_OPTIONS = [
  { label: 'All Categories', value: 'all' },
  ...CATEGORY_OPTIONS,
] as const;
