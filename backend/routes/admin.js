// backend/routes/admin.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// Получить все рейсы
router.get('/flights', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.*,
        g.gate_number,
        STRING_AGG(DISTINCT cd.desk_number, ', ' ORDER BY cd.desk_number) as desk_numbers
      FROM flights f
      LEFT JOIN gates g ON f.gate_id = g.id
      LEFT JOIN flight_check_in_desks fcd ON f.id = fcd.flight_id
      LEFT JOIN check_in_desks cd ON fcd.check_in_desk_id = cd.id
      GROUP BY f.id, g.gate_number
      ORDER BY COALESCE(f.delayed_departure_time, f.departure_time) DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка загрузки рейсов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать рейс с несколькими стойками
router.post('/flights', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { flight_number, arrival_airport, departure_time, gate_id, check_in_desk_ids, aircraft_type } = req.body;

    // Проверяем существование аэропорта
    const airportCheck = await client.query(
      'SELECT iata_code FROM airports WHERE iata_code = $1',
      [arrival_airport]
    );
    
    if (airportCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Указанный аэропорт не найден' });
    }

    // Проверяем существование типа самолета
    const aircraftCheck = await client.query(
      'SELECT model FROM aircraft_types WHERE model = $1',
      [aircraft_type]
    );
    
    if (aircraftCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Указанный тип самолета не найден' });
    }

    // Создаем рейс
    const flightResult = await client.query(
      `INSERT INTO flights (flight_number, departure_airport, arrival_airport, departure_time, gate_id, aircraft_type) 
       VALUES ($1, 'MOW', $2, $3, $4, $5) RETURNING *`,
      [flight_number, arrival_airport, departure_time, gate_id, aircraft_type]
    );
    
    const flight = flightResult.rows[0];
    
    if (check_in_desk_ids && check_in_desk_ids.length > 0) {
      for (const deskId of check_in_desk_ids) {
        await client.query(
          'INSERT INTO flight_check_in_desks (flight_id, check_in_desk_id) VALUES ($1, $2)',
          [flight.id, deskId]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ 
      success: true, 
      message: 'Рейс успешно создан',
      flight: flight 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка создания рейса:', error);
    
    // Обработка ошибки внешнего ключа
    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Указанный тип самолета не существует' });
    }
    
    res.status(500).json({ error: 'Ошибка создания рейса' });
  } finally {
    client.release();
  }
});

// Импорт пассажиров (заглушка)
router.post('/import-passengers', async (req, res) => {
  try {
    console.log('📁 Запрос на импорт пассажиров');
    res.json({ message: 'Импорт выполнен успешно (заглушка)' });
  } catch (error) {
    console.error('❌ Ошибка импорта:', error);
    res.status(500).json({ error: 'Ошибка импорта' });
  }
});

// Тестовый маршрут
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes working!' });
});



router.get('/airports', async (req, res) => {
  try {
    const { search } = req.query;
    console.log('🔍 Поиск аэропортов:', search);
    
    let query = `SELECT iata_code, name, city, country FROM airports`;
    let params = [];
    
    if (search && search.length >= 2) {
      query += ` WHERE 
        iata_code ILIKE $1 OR 
        name ILIKE $1 OR 
        city ILIKE $1 OR
        country ILIKE $1`;
      params.push(`%${search}%`);
      
      query += ` ORDER BY 
        CASE WHEN iata_code ILIKE $1 THEN 1 
             WHEN city ILIKE $1 THEN 2
             WHEN name ILIKE $1 THEN 3
             ELSE 4 END, 
        city, name`;
    } else {
      query += ` ORDER BY city, name`; // Без поиска - обычная сортировка
    }
    
    query += ` LIMIT 20`;
    
    const result = await pool.query(query, params);
    console.log('✅ Найдено аэропортов:', result.rows.length);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Ошибка загрузки аэропортов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Тестовый эндпоинт для проверки
router.get('/airports/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM airports');
    res.json({ count: result.rows.length, airports: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все типы самолетов
router.get('/aircraft-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT model, full_name, business_seats, economy_seats, total_seats 
      FROM aircraft_types 
      ORDER BY manufacturer, model
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка загрузки типов самолетов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Смена статуса рейса
router.patch('/flights/:id/status', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Проверяем существование рейса
    const flightCheck = await client.query('SELECT * FROM flights WHERE id = $1', [id]);
    if (flightCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Рейс не найден' });
    }

    // Если статус "delayed" - ничего не делаем с временем (пока)
    const result = await client.query(
      'UPDATE flights SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({ 
      success: true, 
      message: 'Статус рейса обновлен',
      flight: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Ошибка смены статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

// Эндпоинт для задержки/снятия задержки рейса
// Эндпоинт для задержки рейса
router.patch('/flights/:id/delay', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { delayed_departure_time } = req.body;

    const flightCheck = await client.query('SELECT * FROM flights WHERE id = $1', [id]);
    if (flightCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Рейс не найден' });
    }

    const result = await client.query(
      `UPDATE flights 
       SET is_delayed = true, delayed_departure_time = $1 
       WHERE id = $2 RETURNING *`,
      [delayed_departure_time, id]
    );

    res.json({ 
      success: true, 
      message: 'Время вылета обновлено',
      flight: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Ошибка обновления задержки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});


const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Загрузка пассажиров из CSV
router.post('/flights/:id/passengers', upload.single('csvFile'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Проверяем существование рейса
    const flightCheck = await client.query(`
      SELECT f.*, at.business_seats, at.economy_seats 
      FROM flights f 
      JOIN aircraft_types at ON f.aircraft_type = at.model 
      WHERE f.id = $1
    `, [id]);
    
    if (flightCheck.rows.length === 0) {
      // Удаляем временный файл
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Рейс не найден' });
    }

    const flight = flightCheck.rows[0];
    const passengers = [];
    const errors = [];

    // Читаем CSV файл
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim(), // Убираем пробелы в заголовках
          skipEmptyLines: true
        }))
        .on('data', (row) => {
          // Проверяем обязательные поля
          if (!row.document_number || !row.last_name || !row.first_name || !row.birth_date || !row.class) {
            errors.push(`Неполные данные: ${JSON.stringify(row)}`);
            return;
          }
          
          // Нормализуем класс
          const passengerClass = row.class.toLowerCase();
          if (!['economy', 'business'].includes(passengerClass)) {
            errors.push(`Неверный класс: ${row.class}`);
            return;
          }

          passengers.push({
            flight_id: parseInt(id),
            document_number: row.document_number.trim(),
            first_name: row.first_name.trim(),
            last_name: row.last_name.trim(),
            gender: row.gender ? row.gender.trim().toLowerCase() : null,
            birth_date: row.birth_date.trim(),
            class: passengerClass
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Получаем текущих пассажиров рейса
    const currentPassengers = await client.query(
      'SELECT class, COUNT(*) as count FROM passengers WHERE flight_id = $1 GROUP BY class',
      [id]
    );

    const currentCounts = {
      economy: parseInt(currentPassengers.rows.find(r => r.class === 'economy')?.count || 0),
      business: parseInt(currentPassengers.rows.find(r => r.class === 'business')?.count || 0)
    };

    // Проверяем дубликаты
    const existingPassengers = await client.query(
      'SELECT document_number FROM passengers WHERE flight_id = $1',
      [id]
    );
    
    const existingDocs = new Set(existingPassengers.rows.map(r => r.document_number));
    const duplicates = [];
    const uniquePassengers = [];

    for (const passenger of passengers) {
      if (existingDocs.has(passenger.document_number)) {
        duplicates.push(passenger.document_number);
      } else {
        uniquePassengers.push(passenger);
        existingDocs.add(passenger.document_number); // Защита от дубликатов в текущем файле
      }
    }

    // Проверяем доступность мест для уникальных пассажиров
    const newCounts = {
      economy: currentCounts.economy + uniquePassengers.filter(p => p.class === 'economy').length,
      business: currentCounts.business + uniquePassengers.filter(p => p.class === 'business').length
    };

    if (newCounts.economy > flight.economy_seats || newCounts.business > flight.business_seats) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'Недостаточно мест', 
        details: {
          economy: `Эконом: ${newCounts.economy}/${flight.economy_seats}`,
          business: `Бизнес: ${newCounts.business}/${flight.business_seats}`
        }
      });
    }

    // Сохраняем только уникальных пассажиров
    await client.query('BEGIN');
    
    for (const passenger of uniquePassengers) {
      await client.query(
        `INSERT INTO passengers (flight_id, document_number, first_name, last_name, gender, birth_date, class) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [passenger.flight_id, passenger.document_number, passenger.first_name, 
         passenger.last_name, passenger.gender, passenger.birth_date, passenger.class]
      );
    }
    
    await client.query('COMMIT');

    // Удаляем временный файл
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: `Успешно загружено ${uniquePassengers.length} пассажиров`,
      warnings: duplicates.length > 0 ? `Пропущено ${duplicates.length} дубликатов` : undefined,
      errors: errors.length > 0 ? errors : undefined,
      statistics: {
        economy: `${newCounts.economy}/${flight.economy_seats}`,
        business: `${newCounts.business}/${flight.business_seats}`,
        total: newCounts.economy + newCounts.business
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    // Удаляем временный файл в случае ошибки
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Обработка ошибки уникальности
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Пассажир с таким документом уже существует в этом рейсе' });
    }
    
    console.error('Ошибка загрузки пассажиров:', error);
    res.status(500).json({ error: 'Ошибка загрузки пассажиров: ' + error.message });
  } finally {
    client.release();
  }
});



// Получить статистику по пассажирам рейса
router.get('/flights/:id/passengers/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        f.id,
        at.business_seats,
        at.economy_seats,
        COUNT(p.id) as total_passengers,
        COUNT(CASE WHEN p.class = 'business' THEN 1 END) as business_count,
        COUNT(CASE WHEN p.class = 'economy' THEN 1 END) as economy_count
      FROM flights f
      JOIN aircraft_types at ON f.aircraft_type = at.model
      LEFT JOIN passengers p ON f.id = p.flight_id
      WHERE f.id = $1
      GROUP BY f.id, at.business_seats, at.economy_seats
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Рейс не найден' });
    }
    
    const stats = result.rows[0];
    res.json({
      business: `${stats.business_count}/${stats.business_seats}`,
      economy: `${stats.economy_count}/${stats.economy_seats}`,
      total: stats.total_passengers
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление гейта рейса по названию
router.patch('/flights/:id/gate', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { gate_number } = req.body; // Теперь принимаем номер гейта, а не ID

    // Проверяем существование рейса
    const flightCheck = await client.query('SELECT * FROM flights WHERE id = $1', [id]);
    if (flightCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Рейс не найден' });
    }

    // Ищем гейт по номеру
    const gateCheck = await client.query('SELECT * FROM gates WHERE gate_number = $1', [gate_number]);
    if (gateCheck.rows.length === 0) {
      return res.status(404).json({ error: `Гейт "${gate_number}" не найден` });
    }

    const gateId = gateCheck.rows[0].id;

    const result = await client.query(
      'UPDATE flights SET gate_id = $1 WHERE id = $2 RETURNING *',
      [gateId, id]
    );

    res.json({ 
      success: true, 
      message: `Гейт рейса изменен на ${gate_number}`,
      flight: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Ошибка обновления гейта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

// Обновление стоек регистрации по номерам
router.patch('/flights/:id/desks', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { desk_numbers } = req.body; // Теперь принимаем номера стоек, а не ID

    await client.query('BEGIN');

    // Проверяем существование рейса
    const flightCheck = await client.query('SELECT * FROM flights WHERE id = $1', [id]);
    if (flightCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Рейс не найден' });
    }

    // Удаляем текущие стойки рейса
    await client.query('DELETE FROM flight_check_in_desks WHERE flight_id = $1', [id]);

    // Добавляем новые стойки по номерам
    if (desk_numbers && desk_numbers.length > 0) {
      for (const deskNumber of desk_numbers) {
        const deskCheck = await client.query('SELECT * FROM check_in_desks WHERE desk_number = $1', [deskNumber]);
        if (deskCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: `Стойка "${deskNumber}" не найдена` });
        }

        const deskId = deskCheck.rows[0].id;
        await client.query(
          'INSERT INTO flight_check_in_desks (flight_id, check_in_desk_id) VALUES ($1, $2)',
          [id, deskId]
        );
      }
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: `Стойки регистрации обновлены: ${desk_numbers.join(', ')}`
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка обновления стоек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});






module.exports = router;