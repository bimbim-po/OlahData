export const APP_NAME = 'OlahData';
export const APP_DESCRIPTION = 'Olah data kuesioner skripsi kuantitatif tanpa SPSS';
export const APP_VERSION = '0.1.0';
export const ENGINE_VERSION = '1.0.0-beta';

export const COLORS = {
  bone: '#FAF8F4',
  charcoal: '#1F2328',
  pine: '#1F6F5C',
  amber: '#C98A1B',
  brick: '#B3412E',
  // Dark mode
  darkBg: '#141618',
  darkSurface: '#1C1E21',
  darkBorder: '#2D3036',
} as const;

export const FILE_LIMITS = {
  maxSizeMB: 5,
  allowedExtensions: ['.xlsx', '.xls', '.csv'] as const,
  maxRows: 10000,
  maxColumns: 100,
} as const;

export const LIKERT_SCALE = { min: 1, max: 5 } as const;

export { COPY } from './copy';

