// backend/app.js
const express = require('express');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(require('cors')());

// Упрощенная аутентификация (пропускаем все запросы)
const simpleAuth = (req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next(); // Просто пропускаем все запросы
};

// Подключаем маршруты в ПРАВИЛЬНОМ ПОРЯДКЕ
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', simpleAuth, require('./routes/admin'));
app.use('/api/management', simpleAuth, require('./routes/management'));
app.use('/api/operator', simpleAuth, require('./routes/operator')); // ← ДОБАВЛЕНО
app.use('/api/display', require('./routes/display'));


// Уберите этот дублирующий маршрут - он перекрывает все остальные!
// app.use('/api', simpleAuth, require('./routes/admin')); // ❌ УДАЛИТЬ ЭТУ СТРОКУ

// Тестовый маршрут с проверкой БД
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ 
      message: 'Сервер и БД работают!', 
      users_count: result.rows[0].count 
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// Маршрут для получения всех рейсов (если нужен)
app.get('/api/flights', simpleAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM flights ORDER BY departure_time');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения рейсов' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});