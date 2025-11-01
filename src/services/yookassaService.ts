import axios from 'axios';
import { config } from '../utils/config';

export async function createPaymentSession(userId: string, plan: string) {
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
