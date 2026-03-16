import express from 'express';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const CHAT_ID = process.env.CHAT_ID || '';

const bot = new Telegraf(BOT_TOKEN);

// API endpoint для приёма форм
app.post('/api/submit', async (req, res) => {
  try {
    const data = req.body;
    let message = '';

    if (data.type === 'contact') {
      message = `📝 Новая заявка на контакты\n\n` +
        `Имя: ${data.name || 'Не указано'}\n` +
        `Email: ${data.email || 'Не указано'}\n` +
        `Телефон: ${data.phone || 'Не указано'}\n` +
        `Telegram: ${data.telegram || 'Не указано'}`;
    } else if (data.type === 'assessment') {
      const percentage = data.percentage || 0;
      const yesCount = data.yesCount || 0;
      const totalQuestions = data.totalQuestions || 12;
      
      let level = '';
      if (percentage >= 70) {
        level = '✅ Высокий уровень вовлеченности';
      } else if (percentage >= 50) {
        level = '⚠️ Удовлетворительный уровень (есть над чем работать)';
      } else {
        level = '❌ Низкий уровень вовлеченности (требуется внимание)';
      }

      message = `📊 Результаты диагностики Q12\n\n` +
        `Ответов "Да": ${yesCount} из ${totalQuestions}\n` +
        `Процент вовлеченности: ${percentage}%\n\n` +
        `${level}\n\n` +
        `Ответы:\n${data.answers.map((a, i) => `${i + 1}. ${a ? 'Да' : 'Нет'}`).join('\n')}`;
    } else if (data.type === 'webinar') {
      message = `🎓 Регистрация на вебинар\n\n` +
        `Имя: ${data.name || 'Не указано'}\n` +
        `Email: ${data.email || 'Не указано'}\n` +
        `Компания: ${data.company || 'Не указано'}\n` +
        `Должность: ${data.position || 'Не указано'}`;
    } else {
      message = `📨 Новая заявка\n\n${JSON.stringify(data, null, 2)}`;
    }

    // Отправка в Telegram
    if (CHAT_ID && BOT_TOKEN) {
      await bot.telegram.sendMessage(CHAT_ID, message, {
        parse_mode: 'HTML'
      });
    } else {
      console.log('Telegram not configured. Message:', message);
    }

    res.json({ success: true, message: 'Данные получены' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Bot API server running on port ${PORT}`);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
