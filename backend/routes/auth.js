// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// Маршрут для входа в систему
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Находим пользователя по username
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: '!Неверный логин или пароль' });
    }

    const user = userResult.rows[0];

    // 2. Проверяем пароль с помощью bcrypt (ПРАВИЛЬНАЯ ПРОВЕРКА)
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: '!Неверный логин или пароль' });
    }

    // 3. Создаем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // 4. Отправляем успешный ответ
    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;