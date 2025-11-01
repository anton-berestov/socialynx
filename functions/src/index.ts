import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import OpenAI from 'openai';
import { randomUUID } from 'node:crypto';

admin.initializeApp();

const db = admin.firestore();

interface PaymentPlan {
  id: string;
  title: string;
  price: number;
  periodLabel: string;
  description: string;
  durationDays: number;
  isPopular?: boolean;
  order?: number;
}

async function getPlanFromFirestore(planId: string): Promise<PaymentPlan | null> {
  try {
    const doc = await db.collection('paymentPlans').doc(planId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as PaymentPlan;
  } catch (error) {
    functions.logger.error('Error fetching plan from Firestore', error);
    return null;
  }
}

type GenerateRequest = {
  prompt: string;
  type: 'post' | 'description' | 'hashtags' | 'headline';
  tone: 'friendly' | 'expert' | 'sales';
  length: 'short' | 'medium' | 'long';
};

const LENGTH_TO_TOKENS: Record<GenerateRequest['length'], number> = {
  short: 200,
  medium: 350,
  long: 600
};

const TONE_LABEL: Record<GenerateRequest['tone'], string> = {
  friendly: 'дружелюбном',
  expert: 'экспертном',
  sales: 'продающем'
};

const TYPE_LABEL: Record<GenerateRequest['type'], string> = {
  post: 'пост',
  description: 'описание',
  hashtags: 'список хэштегов',
  headline: 'заголовок'
};

export const generateContent = functions
  .runWith({
    secrets: ['OPENAI_API_KEY'],
    serviceAccount: 'socialynx-2aea1@appspot.gserviceaccount.com'
  })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { prompt, type, tone, length } = req.body as GenerateRequest;

    if (!prompt || !type || !tone || !length) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
      const systemPrompt = `Ты опытный SMM-копирайтер. Сгенерируй ${TYPE_LABEL[type]} по теме "${prompt}" в ${TONE_LABEL[tone]} тоне.`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: LENGTH_TO_TOKENS[length]
      });

      const content = completion.choices[0]?.message?.content ?? '';
      const usage = completion.usage?.total_tokens ?? 0;

      res.json({ result: content.trim(), tokensUsed: usage });
    } catch (error) {
      functions.logger.error('OpenAI error', error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  });

export const createPayment = functions
  .runWith({
    secrets: ['YOO_KASSA_SHOP_ID', 'YOO_KASSA_SECRET_KEY'],
    serviceAccount: 'socialynx-2aea1@appspot.gserviceaccount.com'
  })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { userId, plan, userEmail } = req.body as { userId?: string; plan?: string; userEmail?: string };
    if (!userId || !plan || !userEmail) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const planData = await getPlanFromFirestore(plan);
    if (!planData) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    const shopId = process.env.YOO_KASSA_SHOP_ID;
    const secretKey = process.env.YOO_KASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
      res.status(500).json({ error: 'ЮKassa не настроена' });
      return;
    }

    const idempotenceKey = randomUUID();

    try {
      const amountValue = (planData.price / 100).toFixed(2);

      const response = await axios.post(
        'https://api.yookassa.ru/v3/payments',
        {
          amount: {
            value: amountValue,
            currency: 'RUB'
          },
          capture: true,
          confirmation: {
            type: 'redirect',
            return_url: 'https://chat-flow.ru'
          },
          description: planData.description?.slice(0, 128) || 'Оплата подписки SociaLynx PRO',
          metadata: {
            userId,
            plan
          },
          receipt: {
            customer: {
              email: userEmail || 'no-reply@socialynx.app'
            },
            items: [
              {
                description: planData.title || 'Подписка SociaLynx PRO',
                quantity: 1,
                amount: {
                  value: amountValue,
                  currency: 'RUB'
                },
                vat_code: 1
              }
            ]
          },
          // save_payment_method: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Idempotence-Key': idempotenceKey
          },
          auth: {
            username: shopId,
            password: secretKey
          }
        }
      );

      await db.collection('paymentSessions').doc(response.data.id).set({
        userId,
        plan,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ confirmationUrl: response.data.confirmation.confirmation_url, paymentId: response.data.id });
    } catch (error: any) {
      functions.logger.error('YooKassa error', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        requestBody: error.config?.data,
      });
      res.status(500).json({ error: 'Не удалось создать платеж', details: error.response?.data });
      res.status(500).json({ error: 'Не удалось создать платеж' });
    }
  });

export const paymentCallback = functions
  .runWith({
    secrets: ['YOO_KASSA_SHOP_ID', 'YOO_KASSA_SECRET_KEY'],
    serviceAccount: 'socialynx-2aea1@appspot.gserviceaccount.com'
  })
  .https.onRequest(async (req, res) => {
    const event = req.body?.event;
    const payment = req.body?.object;

    if (!event || !payment) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    try {
      await db.collection('paymentSessions').doc(payment.id).set(
        {
          status: payment.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      if (payment.status === 'succeeded') {
        const { userId, plan } = payment.metadata ?? {};
        if (userId && plan) {
          const planData = await getPlanFromFirestore(plan);
          if (planData) {
            const now = admin.firestore.Timestamp.now();
            const expiresAt = admin.firestore.Timestamp.fromMillis(
              now.toMillis() + planData.durationDays * 24 * 60 * 60 * 1000
            );

            await db.collection('subscriptions').doc(userId).set(
              {
                status: 'pro',
                planId: plan,
                updatedAt: now,
                expiresAt
              },
              { merge: true }
            );
          }
        }
      }
    } catch (error) {
      functions.logger.error('Payment callback error', error);
      res.status(500).json({ error: 'Webhook error' });
      return;
    }

    res.status(200).json({ received: true });
  });
