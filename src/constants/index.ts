export const CONTENT_TYPES = [
  { key: 'post', label: 'Пост', maxTokens: 350 },
  { key: 'description', label: 'Описание', maxTokens: 250 },
  { key: 'hashtags', label: 'Хэштеги', maxTokens: 120 },
  { key: 'headline', label: 'Заголовок', maxTokens: 80 }
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number]['key'];

export const TONES = [
  { key: 'friendly', label: 'Дружелюбный' },
  { key: 'expert', label: 'Экспертный' },
  { key: 'sales', label: 'Продающий' }
] as const;

export type Tone = (typeof TONES)[number]['key'];

export const LENGTHS = [
  { key: 'short', label: 'Короткий', maxTokens: 180 },
  { key: 'medium', label: 'Средний', maxTokens: 320 },
  { key: 'long', label: 'Длинный', maxTokens: 550 }
] as const;

export type ContentLength = (typeof LENGTHS)[number]['key'];

export const FREE_DAILY_LIMIT = 3;
