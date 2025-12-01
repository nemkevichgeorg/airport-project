// backend/routes/management.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// Получить все гейты
router.get('/gates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gates WHERE is_active = true ORDER BY gate_number');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения гейтов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить новый гейт
router.post('/gates', async (req, res) => {
  try {
    const { gate_number, description } = req.body;
    
    const result = await pool.query(
      'INSERT INTO gates (gate_number, description) VALUES ($1, $2) RETURNING *',
      [gate_number, description]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Гейт с таким номером уже существует' });
    }
    res.status(500).json({ error: 'Ошибка создания гейта' });
  }
});

// Получить все стойки регистрации
router.get('/check-in-desks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM check_in_desks WHERE is_active = true ORDER BY desk_number');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения стоек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить новую стойку регистрации
// backend/routes/management.js
router.post('/check-in-desks', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('📝 Данные для создания стойки:', req.body); // ← Добавь логирование
    
    const { desk_number, description } = req.body;
    
    // Проверка обязательных полей
    if (!desk_number) {
      return res.status(400).json({ error: 'Номер стойки обязателен' });
    }
    
    const result = await client.query(
      'INSERT INTO check_in_desks (desk_number, description) VALUES ($1, $2) RETURNING *',
      [desk_number, description || '']
    );
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Ошибка создания стойки:', error);
    
    // Проверка на уникальность номера стойки
    if (error.code === '23505') { // Код ошибки уникальности в PostgreSQL
      return res.status(400).json({ error: 'Стойка с таким номером уже существует' });
    }
    
    res.status(500).json({ error: 'Ошибка создания стойки регистрации' });
  } finally {
    client.release();
  }
});

// В management.js добавь:
router.get('/check-in-desks/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM check_in_desks ORDER BY id');
    console.log('📋 Существующие стойки:', result.rows);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;