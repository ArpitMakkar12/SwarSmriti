// The backend address lives in services/api.ts (read from VITE_API_BASE_URL).

export const COLORS = {
  ivory: '#F4F3EF',
  charcoal: '#3C3C3B',
  warmGrey: '#6E6E6E',
  roseGold: '#D4A5A5',
  copperRose: '#C97C5D',
  warmBeige: '#E0DDD6',
};

export const ROUTES = {
  DASHBOARD: '/',
  PERSONA: '/persona',
  TRAIN: '/train',
  TALK: '/talk',
  MEMORIES: '/memories',
};

export const SAMPLE_MEMORY_PROMPTS = [
  'Tell me about your childhood memories',
  'What are your core values and beliefs?',
  'Describe your relationships with family',
  'What brings you joy and happiness?',
  'Share your proudest achievements',
  'What are your fears and concerns?',
  'Describe your daily routines and habits',
  'What advice would you give to loved ones?',
];

export const MIN_MEMORY_CHARS = 100;
export const MAX_MEMORY_CHARS = 5000;