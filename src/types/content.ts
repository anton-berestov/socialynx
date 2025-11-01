import { ContentType, Tone, ContentLength } from '../constants';

export interface GeneratedContentItem {
  id: string;
  prompt: string;
  type: ContentType;
  tone: Tone;
  length: ContentLength;
  result: string;
  createdAt: number;
  isProOnly?: boolean;
}
