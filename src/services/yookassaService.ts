import axios from 'axios';
import { config } from '../utils/config';

export interface PaymentPlan {
  id: 'plan_monthly' | 'plan_quarterly' | 'plan_yearly';
  title: string;
  price: number;
  periodLabel: string;
}

export const PAYMENT_PLANS: PaymentPlan[] = [
  { id: 'plan_monthly', title: '199 ₽ / мес', price: 19900, periodLabel: 'В месяц' },
  { id: 'plan_quarterly', title: '499 ₽ / 3 мес', price: 49900, periodLabel: 'Каждые 3 месяца' },
  { id: 'plan_yearly', title: '1499 ₽ / год', price: 149900, periodLabel: 'В год' }
];

export async function createPaymentSession(userId: string, plan: PaymentPlan['id']) {
  if (!config.backendUrl) {
    throw new Error('Не настроен backendUrl для ЮKassa');
  }

  try {
    const response = await axios.post(`${config.backendUrl}/createPayment`, {
      userId,
      plan
    });

    return response.data as {
      confirmationUrl: string;
      paymentId: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error('Payment creation error:', errorMessage);
      throw new Error(`Ошибка создания платежа: ${errorMessage}`);
    }
    throw error;
  }
}
