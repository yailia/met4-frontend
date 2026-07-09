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
- Resend API key (для отправки email — https://resend.com)

### Настройка

1. Скопируйте `.env.example` в `.env` и заполните:
   ```env
   RESEND_KEY=your_resend_api_key
   LEAD_INBOX=owner@example.com
   ```

### Запуск через Docker

```bash
docker-compose up -d
```

Сайт будет доступен по адресу: http://localhost

### Локальная разработка

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### API

```bash
cd api
npm install
npm run dev    # http://localhost:3001
npm test       # vitest
```

Не забудьте создать `.env` файлы в каждой папке с соответствующими переменными.

## Технологии

- **Frontend**: Astro 5 + Svelte 5
- **API**: Hono 4 + @libsql/client (sqlite) + Resend
- **Deployment**: Docker + Docker Compose + Nginx + GitHub Actions

## Структура сайта

- `/` - Главная страница
- `/assessment` - Страница оценки (тест Q12)
- `/webinar` - Регистрация на вебинар
- `/products` - Продукты и услуги
- `/blog` - Блог
- `/gallery` - Галерея

## API

### POST /api/submit

Принимает данные форм (contact / webinar), сохраняет заявку в sqlite и отправляет email владельцу через Resend.

Типы запросов:
- `contact` - контактная форма
- `webinar` - регистрация на вебинар

### POST /sessions, POST /answers, GET /report/:hash

Диагностика Q12: создание сессии, ответы сотрудников, отчёт с процентами по 12 вопросам.

## Лицензия

MIT
