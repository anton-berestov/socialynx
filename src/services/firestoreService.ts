import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';
import { GeneratedContentItem } from '../types/content';
import { ContentLength, ContentType, Tone } from '../constants';

const COLLECTION_NAME = 'generations';

export async function saveGeneration(
  userId: string,
  data: {
    prompt: string;
    type: ContentType;
    tone: Tone;
    length: ContentLength;
    result: string;
    tokensUsed: number;
  }
) {
  const collectionRef = collection(firestore, `users/${userId}/${COLLECTION_NAME}`);
  await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function fetchGenerations(userId: string): Promise<GeneratedContentItem[]> {
  const collectionRef = collection(firestore, `users/${userId}/${COLLECTION_NAME}`);
  const snapshot = await getDocs(query(collectionRef, orderBy('createdAt', 'desc')));

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<GeneratedContentItem, 'id' | 'createdAt'> & { createdAt?: { seconds: number } };

    return {
      id: doc.id,
      prompt: data.prompt,
      type: data.type,
      tone: data.tone,
      length: data.length,
      result: data.result,
      createdAt: data.createdAt ? data.createdAt.seconds * 1000 : Date.now()
    };
  });
}
