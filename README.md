# МЭТЧ - Проект устойчивости команд

Проект для повышения эффективности компании через развитие устойчивости команд.

## Структура проекта

- `frontend/` - Astro фронтенд приложение
- `bot/` - Telegram бот (не деплоится, legacy)
- `api/` - Hono API (сессии Q12, ответы, отчёты, заявки с форм)
- `docker-compose.yml` - Оркестрация контейнеров

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)
- Telegram бот токен (получить через [@BotFather](https://t.me/botfather))

### Настройка

1. Скопируйте `.env.example` в `.env` и заполните:
   ```env
   RESEND_KEY=your_resend_api_key
   LEAD_INBOX=owner@example.com
   ```

2. Для получения CHAT_ID используйте [@userinfobot](https://t.me/userinfobot) в Telegram

### Запуск через Docker

```bash
docker-compose up -d
```

Сайт будет доступен по адресу: http://localhost

API бота: http://localhost:3000

### Локальная разработка

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Bot

```bash
cd bot
npm install
npm start
```

Не забудьте создать `.env` файлы в каждой папке с соответствующими переменными.

## Технологии

- **Frontend**: Astro + Svelte
- **Backend**: Node.js + Express + Telegraf
- **Deployment**: Docker + Docker Compose + Nginx

## Структура сайта

- `/` - Главная страница
- `/assessment` - Страница оценки (тест Q12)
- `/webinar` - Регистрация на вебинар
- `/products` - Продукты и услуги
- `/blog` - Блог
- `/gallery` - Галерея

## API

### POST /api/submit

Принимает данные форм и отправляет уведомления в Telegram.

Типы запросов:
- `contact` - контактная форма
- `assessment` - результаты теста Q12
- `webinar` - регистрация на вебинар

## Лицензия

MIT
