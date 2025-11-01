import axios from 'axios';
import { config } from '../utils/config';
import { ContentLength, ContentType, Tone } from '../constants';

interface GenerateContentPayload {
  prompt: string;
  type: ContentType;
  tone: Tone;
  length: ContentLength;
}

export async function generateContent({ prompt, type, tone, length }: GenerateContentPayload) {
  if (!config.openaiFunctionUrl) {
    throw new Error('Не настроен адрес облачной функции для генерации контента');
  }

  const response = await axios.post(config.openaiFunctionUrl, {
    prompt,
    type,
    tone,
    length
  });

  return response.data as { result: string; tokensUsed: number };
}
