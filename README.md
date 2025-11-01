# SociaLynx

Мобильное приложение на React Native (Expo) для генерации контента: идеи постов, описания, хэштеги, заголовки и CTA. Проект рассчитан на блогеров, SMM-специалистов и владельцев малого бизнеса.

## Основные возможности
- Экран генерации контента с поддержкой разных типов (пост, описание, хэштеги, заголовок)
- Настройки тона и длины текста (PRO)
- Ограничение до 3 генераций в сутки на бесплатном тарифе + реклама
- История генераций, сохранение в Firestore
- Профиль пользователя с email-аутентификацией и статусом подписки
- Экран оформления подписки через ЮKassa (REST API)
- Интеграция с Firebase (Auth, Firestore, Cloud Functions) и OpenAI API через защищенную функцию

## Стек
- Expo SDK 51 / React Native 0.74
- Firebase (Auth, Firestore, Functions)
- OpenAI API (gpt-4o-mini)
- ЮKassa REST API для платежей
- Яндекс Mobile Ads (заглушка в Expo, требуется замена на нативный модуль)

## Структура проекта
```
SociaLynx/
├── app.json              # Конфигурация Expo + extra
├── package.json          # Frontend зависимости
├── src/
│   ├── App.tsx           # Точка входа приложения
│   ├── screens/          # Экраны (Main, History, Profile, Paywall, Details)
│   ├── navigation/       # Настройки React Navigation
│   ├── context/          # Провайдеры Auth и Subscription
│   ├── services/         # Firebase, OpenAI proxy, Firestore, ЮKassa, Ads
│   ├── hooks/            # Хуки (useContentGenerator, useDailyLimit)
│   ├── constants/        # Константы типов, тонов, лимитов
│   ├── components/       # Общие компоненты (AdBannerPlaceholder)
│   └── utils/            # Конфиг extra
└── functions/            # Firebase Cloud Functions
    ├── src/index.ts      # generateContent, createPayment, paymentCallback
    ├── package.json
    └── tsconfig.json
```

## Подготовка окружения
1. **Установите зависимости**
   ```bash
   npm install
   ```
2. **Заполните конфигурацию Firebase и бэкенда**
   - В `app.json` → `expo.extra` задайте параметры Firebase, URL функции генерации и backendUrl (`https://us-central1-<project>.cloudfunctions.net`).
   - Секреты для OpenAI и ЮKassa хранятся в Config/Secrets Firebase Functions.
3. **Настройте Firebase**
   - Создайте проект Firebase, включите Auth (Email/Password, Google по желанию) и Firestore.
   - Разверните Cloud Functions (см. нижу).
4. **ЮKassa**
   - Получите `shopId` и `secretKey`.
   - Включите webhook на URL `https://<region>-<project>.cloudfunctions.net/paymentCallback`.
5. **Запуск приложения**
   ```bash
   npx expo start
   ```

## Firebase Functions

### Деплой функций

1. **Установите Firebase CLI (если еще не установлен)**
   ```bash
   npm install -g firebase-tools
   ```

2. **Войдите в Firebase**
   ```bash
   firebase login
   ```

3. **Установите зависимости и задеплойте функции**
   ```bash
   cd functions
   npm install
   npm run deploy
   ```

### Настройка секретов Firebase Functions

После первого деплоя нужно настроить секреты:

```bash
# Установка секретов
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set YOO_KASSA_SHOP_ID
firebase functions:secrets:set YOO_KASSA_SECRET_KEY

# После установки секретов - повторный деплой
npm run deploy
```

### Функции:
- `generateContent` — прокси к OpenAI, скрывает API-ключ и возвращает текст + число токенов
- `createPayment` — создаёт платёж в ЮKassa и сохраняет сессию в Firestore
- `paymentCallback` — обрабатывает webhook ЮKassa и выставляет статус подписки PRO

### URL функций после деплоя:
После успешного деплоя ваши функции будут доступны по адресам:
- `https://us-central1-socialynx-2aea1.cloudfunctions.net/generateContent`
- `https://us-central1-socialynx-2aea1.cloudfunctions.net/createPayment`
- `https://us-central1-socialynx-2aea1.cloudfunctions.net/paymentCallback`

> ⚠️ **Важно**: После деплоя функций убедитесь, что URL в `app.json` соответствуют реальным URL ваших функций!

> ⚠️ Expo Go не поддерживает ЮKassa и Яндекс Ads из коробки. Для продакшна переключитесь на Bare Workflow, подключите нативные SDK и обновите заглушки (`AdBannerPlaceholder`, `adService`).

## Дальнейшие шаги
1. Подключить Google / VK авторизацию (через Firebase OAuth) и заменить email-форму.
2. Вынести ограничения генераций и счётчик на серверную сторону, чтобы исключить обход лимитов.
3. Настроить push-уведомления (Firebase Cloud Messaging) и аналитку (Firebase Analytics).
4. Заменить компоненты рекламы на реальный Яндекс Mobile Ads SDK после eject.
5. Добавить генерацию серии постов и тонов в UI (для PRO) на основе текущего API.
