import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from './firebase';

const COLLECTION = 'subscriptions';

interface SubscriptionData {
  status: 'free' | 'pro';
  expiresAt?: Timestamp;
  updatedAt: Timestamp;
  planId?: string;
}

export async function getSubscriptionStatus(userId: string) {
  const ref = doc(firestore, COLLECTION, userId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return { status: 'free' as const };
  }

  const data = snapshot.data() as SubscriptionData;
  if (data.status === 'pro' && data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
    return { status: 'free' as const };
  }

  return data;
}

export async function updateSubscriptionStatus(
  userId: string,
  status: SubscriptionData
) {
  const ref = doc(firestore, COLLECTION, userId);
  await setDoc(ref, status, { merge: true });
}
