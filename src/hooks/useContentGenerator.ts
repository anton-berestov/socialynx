import { useState } from 'react';
import { ContentLength, ContentType, Tone } from '../constants';
import { generateContent } from '../services/contentService';
import { saveGeneration } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

interface GenerateParams {
  prompt: string;
  type: ContentType;
  tone: Tone;
  length: ContentLength;
}

export function useContentGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const { user } = useAuth();

  const handleGenerate = async ({ prompt, type, tone, length }: GenerateParams) => {
    setLoading(true);
    setError(null);

    try {
      const { result: text, tokensUsed } = await generateContent({ prompt, type, tone, length });
      setResult(text);
      if (user) {
        await saveGeneration(user.uid, { prompt, type, tone, length, result: text, tokensUsed });
      }
      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сгенерировать контент';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    handleGenerate
  };
}
