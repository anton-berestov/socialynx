import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import OpenAI from 'openai';
import { randomUUID } from 'node:crypto';

admin.initializeApp();

const db = admin.firestore();

const PLAN_PRICES: Record<string, { amount: number; description: string; period: string }> = {
  plan_monthly: { amount: 19900, description: 'SociaLynx PRO — месяц', period: 'month' },
  plan_quarterly: { amount: 49900, description: 'SociaLynx PRO — 3 месяца', period: 'quarter' },
  plan_yearly: { amount: 149900, description: 'SociaLynx PRO — год', period: 'year' }
};

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

    const { userId, plan } = req.body as { userId?: string; plan?: keyof typeof PLAN_PRICES };
    if (!userId || !plan || !PLAN_PRICES[plan]) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const shopId = process.env.YOO_KASSA_SHOP_ID;
    const secretKey = process.env.YOO_KASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
      res.status(500).json({ error: 'ЮKassa не настроена' });
      return;
    }

    const idempotenceKey = randomUUID();
    const price = PLAN_PRICES[plan];

    try {
      const response = await axios.post(
        'https://api.yookassa.ru/v3/payments',
        {
          amount: {
            value: (price.amount / 100).toFixed(2),
            currency: 'RUB'
          },
          capture: true,
          confirmation: {
            type: 'redirect',
            return_url: 'https://socialynx.app/payments/success'
          },
          description: price.description,
          metadata: {
            userId,
            plan
          }
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
    } catch (error) {
      functions.logger.error('YooKassa error', error);
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
        if (userId && plan && PLAN_PRICES[plan]) {
          const now = admin.firestore.Timestamp.now();
          const expiresAt = admin.firestore.Timestamp.fromMillis(
            plan === 'plan_monthly'
              ? now.toMillis() + 30 * 24 * 60 * 60 * 1000
              : plan === 'plan_quarterly'
              ? now.toMillis() + 90 * 24 * 60 * 60 * 1000
              : now.toMillis() + 365 * 24 * 60 * 60 * 1000
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
    } catch (error) {
      functions.logger.error('Payment callback error', error);
      res.status(500).json({ error: 'Webhook error' });
      return;
    }

    res.status(200).json({ received: true });
  });
