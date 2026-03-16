# MET4 Telegram Bot

Telegram бот для обработки форм с сайта МЭТЧ.

## Настройка

1. Создайте бота через [@BotFather](https://t.me/botfather) в Telegram
2. Получите токен бота
3. Узнайте ID чата, куда отправлять уведомления (можно использовать [@userinfobot](https://t.me/userinfobot))
4. Скопируйте `.env.example` в `.env` и заполните значения:

```env
BOT_TOKEN=your_bot_token_here
CHAT_ID=your_chat_id_here
PORT=3000
```

## Установка

```bash
npm install
```

## Запуск

```bash
npm start
```

Для разработки с автоперезагрузкой:

```bash
npm run dev
```

## API Endpoints

### POST /api/submit

Принимает данные форм с фронтенда и отправляет уведомления в Telegram.

**Типы запросов:**

1. **contact** - контактная форма
2. **assessment** - результаты теста Q12
3. **webinar** - регистрация на вебинар

### GET /health

Проверка работоспособности сервера.
