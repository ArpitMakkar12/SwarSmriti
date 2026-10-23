// The backend address lives in services/api.ts (read from VITE_API_BASE_URL).

// The Heirloom palette (the same values live in tailwind.config.js)
export const COLORS = {
  paper: '#F2ECE1',
  card: '#FBF7EF',
  ink: '#2A2420',
  oxblood: '#8C2F39',
  tape: '#D6C4A4',
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