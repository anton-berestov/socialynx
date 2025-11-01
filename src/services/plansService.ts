import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firestore } from './firebase';

export interface PaymentPlan {
  id: string;
  title: string;
  price: number;
  periodLabel: string;
  description: string;
  durationDays: number;
  isPopular?: boolean;
  order?: number;
}

const PLANS_COLLECTION = 'paymentPlans';

export async function fetchPaymentPlans(): Promise<PaymentPlan[]> {
  try {
    const plansRef = collection(firestore, PLANS_COLLECTION);
    const q = query(plansRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return getDefaultPlans();
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PaymentPlan[];
  } catch (error) {
    console.error('Error fetching payment plans:', error);
    return getDefaultPlans();
  }
}

function getDefaultPlans(): PaymentPlan[] {
  return [
    {
      id: 'plan_monthly',
      title: '399 ₽ / мес',
      price: 39900,
      periodLabel: 'В месяц',
      description: 'SociaLynx PRO — месяц',
      durationDays: 30,
      order: 1,
      isPopular: false
    },
    {
      id: 'plan_quarterly',
      title: '799 ₽ / 3 мес',
      price: 79900,
      periodLabel: 'Каждые 3 месяца',
      description: 'SociaLynx PRO — 3 месяца',
      durationDays: 90,
      order: 2,
      isPopular: true
    },
    {
      id: 'plan_yearly',
      title: '1999 ₽ / год',
      price: 199900,
      periodLabel: 'В год',
      description: 'SociaLynx PRO — год',
      durationDays: 365,
      order: 3,
      isPopular: false
    }
  ];
}