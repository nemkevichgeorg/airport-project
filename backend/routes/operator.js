//\airport-project\backend\routes\operator.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить все стойки регистрации
router.get('/checkin-desks', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM check_in_desks ORDER BY desk_number');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения стоек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все гейты
router.get('/gates', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM gates ORDER BY gate_number');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения гейтов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить активные рейсы для стоек и гейтов
router.get('/active-flights', async (req, res) => {
  try {
    const flightsQuery = `
      SELECT 
        f.*,
        g.gate_number,
        ARRAY_AGG(d.desk_number) as desk_numbers
      FROM flights f
      LEFT JOIN gates g ON f.gate_id = g.id
      LEFT JOIN flight_check_in_desks fcd ON f.id = fcd.flight_id
      LEFT JOIN check_in_desks d ON fcd.check_in_desk_id = d.id
      WHERE f.status IN ('scheduled', 'check_in', 'boarding', 'last_call')
      GROUP BY f.id, g.gate_number
      ORDER BY f.departure_time DESC
    `;

    const result = await db.query(flightsQuery);
    
    const activeFlights = {
      checkin: {},    // Активные рейсы для стоек (check_in)
      scheduled: {},  // Запланированные рейсы для стоек (scheduled)
      gate: {},       // Активные рейсы для гейтов (boarding, last_call)
      gateScheduled: {} // Запланированные рейсы для гейтов (scheduled, check_in)
    };
    
    result.rows.forEach(flight => {
      // Для стоек регистрации
      if (flight.desk_numbers && flight.desk_numbers[0]) {
        flight.desk_numbers.forEach(deskNumber => {
          if (flight.status === 'check_in') {
            // Активные рейсы (регистрация)
            if (!activeFlights.checkin[deskNumber]) {
              activeFlights.checkin[deskNumber] = [];
            }
            activeFlights.checkin[deskNumber].push(flight);
          } else if (flight.status === 'scheduled') {
            // Запланированные рейсы
            if (!activeFlights.scheduled[deskNumber]) {
              activeFlights.scheduled[deskNumber] = [];
            }
            activeFlights.scheduled[deskNumber].push(flight);
          }
        });
      }
      
      // Для гейтов
      if (flight.gate_number) {
        if (flight.status === 'boarding' || flight.status === 'last_call') {
          // Активные рейсы (посадка)
          if (!activeFlights.gate[flight.gate_number]) {
            activeFlights.gate[flight.gate_number] = [];
          }
          activeFlights.gate[flight.gate_number].push(flight);
        } else if (flight.status === 'scheduled' || flight.status === 'check_in') {
          // Запланированные рейсы
          if (!activeFlights.gateScheduled[flight.gate_number]) {
            activeFlights.gateScheduled[flight.gate_number] = [];
          }
          activeFlights.gateScheduled[flight.gate_number].push(flight);
        }
      }
    });

    res.json(activeFlights);
  } catch (error) {
    console.error('Ошибка получения активных рейсов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить пассажиров рейса для стойки
router.get('/desk/:deskNumber/passengers', async (req, res) => {
  try {
    const { deskNumber } = req.params;
    
    const query = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.document_number,
        p.class,
        p.is_checked_in,
        p.boarding_pass_number,
        p.seat_number,
        p.has_baggage,
        p.has_boarded,
        f.flight_number, 
        f.arrival_airport,
        f.departure_time,
        g.gate_number
      FROM passengers p
      JOIN flights f ON p.flight_id = f.id
      JOIN flight_check_in_desks fcd ON f.id = fcd.flight_id
      JOIN check_in_desks d ON fcd.check_in_desk_id = d.id
      LEFT JOIN gates g ON f.gate_id = g.id
      WHERE d.desk_number = $1 AND f.status = 'check_in' AND p.is_checked_in = false
      ORDER BY p.last_name, p.first_name
    `;
    
    const result = await db.query(query, [deskNumber]);
    
    // Форматируем полное имя
    const passengers = result.rows.map(passenger => ({
      ...passenger,
      full_name: `${passenger.first_name} ${passenger.last_name}`,
      ticket: passenger.document_number, // для совместимости с фронтендом
      class_type: passenger.class        // для совместимости с фронтендом
    }));
    
    res.json(passengers);
  } catch (error) {
    console.error('Ошибка получения пассажиров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить пассажиров рейса для гейта
router.get('/gate/:gateNumber/passengers', async (req, res) => {
  try {
    const { gateNumber } = req.params;
    
    const query = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.document_number,
        p.class,
        p.is_checked_in,
        p.boarding_pass_number,
        p.seat_number,
        p.has_baggage,
        p.has_boarded,
        f.flight_number, 
        f.arrival_airport,
        f.departure_time
        g.gate_number
      FROM passengers p
      JOIN flights f ON p.flight_id = f.id
      JOIN gates g ON f.gate_id = g.id
      LEFT JOIN gates g ON f.gate_id = g.id
      WHERE g.gate_number = $1 AND f.status IN ('boarding', 'last_call') AND p.is_checked_in = true AND p.has_boarded = false
      ORDER BY p.last_name, p.first_name
    `;
    
    const result = await db.query(query, [gateNumber]);
    
    // Форматируем полное имя
    const passengers = result.rows.map(passenger => ({
      ...passenger,
      full_name: `${passenger.first_name} ${passenger.last_name}`,
      ticket: passenger.document_number, // для совместимости с фронтендом
      class_type: passenger.class        // для совместимости с фронтендом
    }));
    
    res.json(passengers);
  } catch (error) {
    console.error('Ошибка получения пассажиров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Зарегистрировать пассажира
router.post('/passengers/:passengerId/checkin', async (req, res) => {
  try {
    const { passengerId } = req.params;
    
    const updateQuery = `
      UPDATE passengers 
      SET is_checked_in = true,
          created_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [passengerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пассажир не найден' });
    }
    
    res.json({ message: 'Пассажир зарегистрирован', passenger: result.rows[0] });
  } catch (error) {
    console.error('Ошибка регистрации пассажира:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сгенерировать посадочный талон
router.post('/passengers/:passengerId/boarding-pass', async (req, res) => {
  try {
    const { passengerId } = req.params;
    
    // Генерируем номер посадочного талона
    const boardingPassNumber = 'P' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Math.random().toString(36).substr(2, 11).toUpperCase();
    
    const updateQuery = `
      UPDATE passengers 
      SET boarding_pass_number = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [boardingPassNumber, passengerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пассажир не найден' });
    }
    
    res.json({ 
      message: 'Посадочный талон сгенерирован', 
      passenger: result.rows[0] 
    });
  } catch (error) {
    console.error('Ошибка генерации талона:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Назначить место пассажиру
router.patch('/passengers/:passengerId/seat', async (req, res) => {
  try {
    const { passengerId } = req.params;
    const { seat_number } = req.body;
    
    const updateQuery = `
      UPDATE passengers 
      SET seat_number = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [seat_number, passengerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пассажир не найден' });
    }
    
    res.json({ message: 'Место назначено', passenger: result.rows[0] });
  } catch (error) {
    console.error('Ошибка назначения места:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить багаж (старая версия - оставьте для совместимости)
router.patch('/passengers/:passengerId/baggage', async (req, res) => {
  try {
    const { passengerId } = req.params;
    const { weight } = req.body;
    
    const updateQuery = `
      UPDATE passengers 
      SET has_baggage = true
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [passengerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пассажир не найден' });
    }
    
    res.json({ message: 'Багаж добавлен', passenger: result.rows[0] });
  } catch (error) {
    console.error('Ошибка добавления багажа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить флаг багажа пассажира (НОВЫЙ ENDPOINT)
router.patch('/passengers/:passengerId/baggage-flag', async (req, res) => {
  try {
    const { passengerId } = req.params;
    const { has_baggage } = req.body;
    
    const updateQuery = `
      UPDATE passengers 
      SET has_baggage = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [has_baggage, passengerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пассажир не найден' });
    }
    
    res.json({ 
      message: 'Флаг багажа обновлен', 
      passenger: result.rows[0] 
    });
  } catch (error) {
    console.error('Ошибка обновления флага багажа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Подтвердить посадку пассажира
router.post('/passengers/:passengerId/board', async (req, res) => {
  try {
    const { passengerId } = req.params;
    
    const updateQuery = `
      UPDATE passengers 
      SET has_boarded = true
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [passengerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пассажир не найден' });
    }
    
    res.json({ message: 'Посадка подтверждена', passenger: result.rows[0] });
  } catch (error) {
    console.error('Ошибка подтверждения посадки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить занятые места для рейса по номеру рейса
router.get('/flights/:flightNumber/occupied-seats', async (req, res) => {
  try {
    const { flightNumber } = req.params;
    
    const query = `
      SELECT p.seat_number 
      FROM passengers p
      JOIN flights f ON p.flight_id = f.id
      WHERE f.flight_number = $1 AND p.seat_number IS NOT NULL
    `;
    
    const result = await db.query(query, [flightNumber]);
    const occupiedSeats = result.rows.map(row => row.seat_number);
    
    res.json(occupiedSeats);
  } catch (error) {
    console.error('Ошибка получения занятых мест:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Функция для генерации tag_id (например: BP123456789)
const generateTagId = () => {
  return 'T' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Добавить багаж в таблицу luggage и обновить флаг пассажира
router.post('/luggage', async (req, res) => {
  try {
    const { flight_number, date, arrival_airport, first_name, last_name, weight, passenger_id } = req.body;

    const tagId = generateTagId();

    // Вставляем багаж в таблицу luggage с passenger_id
    const luggageQuery = `
      INSERT INTO luggage 
      (tag_id, flight_number, date, arrival_airport, first_name, last_name, weight, passenger_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const luggageResult = await db.query(luggageQuery, [
      tagId,
      flight_number,
      date,
      arrival_airport,
      first_name,
      last_name,
      weight,
      passenger_id
    ]);

    // Обновляем флаг has_baggage у пассажира
    if (passenger_id) {
      const updatePassengerQuery = `
        UPDATE passengers 
        SET has_baggage = true
        WHERE id = $1
      `;
      await db.query(updatePassengerQuery, [passenger_id]);
    }

    res.json({ 
      message: 'Багаж добавлен',
      baggage: luggageResult.rows[0]
    });
  } catch (error) {
    console.error('Ошибка добавления багажа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить багаж пассажира - ТЕПЕРЬ ПО passenger_id
router.get('/passengers/:passengerId/luggage', async (req, res) => {
  try {
    const { passengerId } = req.params;
    
    // Получаем багаж пассажира по passenger_id
    const luggageQuery = `
      SELECT * FROM luggage 
      WHERE passenger_id = $1
      ORDER BY tag_id
    `;
    
    const luggageResult = await db.query(luggageQuery, [passengerId]);

    res.json(luggageResult.rows);
  } catch (error) {
    console.error('Ошибка получения багажа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// \backend\routes\operator.js - ДОБАВИТЬ ЭТОТ МАРШРУТ

// Найти пассажира по номеру посадочного талона и подтвердить посадку
// ПРАВИЛЬНАЯ ВЕРСИЯ - УБИРАЕМ boarded_at
router.post('/scan-boarding-pass', async (req, res) => {
  try {
    const { boarding_pass_number } = req.body;

    if (!boarding_pass_number) {
      return res.status(400).json({ error: 'Номер посадочного талона обязателен' });
    }

    // Находим пассажира по номеру посадочного талона
    const passengerQuery = `
      SELECT 
        p.*,
        f.flight_number,
        f.arrival_airport,
        f.departure_time,
        f.status as flight_status,
        g.gate_number
      FROM passengers p
      JOIN flights f ON p.flight_id = f.id
      LEFT JOIN gates g ON f.gate_id = g.id
      WHERE p.boarding_pass_number = $1
    `;

    const passengerResult = await db.query(passengerQuery, [boarding_pass_number]);

    if (passengerResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Посадочный талон не найден',
        found: false
      });
    }

    const passenger = passengerResult.rows[0];

    // Проверяем, можно ли посадить пассажира
    if (passenger.has_boarded) {
      return res.status(400).json({
        error: 'Пассажир уже прошел посадку',
        found: true,
        passenger: passenger,
        status: 'already_boarded'
      });
    }

    if (!passenger.is_checked_in) {
      return res.status(400).json({
        error: 'Пассажир не прошел регистрацию',
        found: true,
        passenger: passenger,
        status: 'not_checked_in'
      });
    }

    if (passenger.flight_status !== 'boarding' && passenger.flight_status !== 'last_call') {
      return res.status(400).json({
        error: 'Посадка для этого рейса не активна',
        found: true,
        passenger: passenger,
        status: 'boarding_not_active'
      });
    }

    // Подтверждаем посадку - ТОЛЬКО has_boarded = true
    const updateQuery = `
      UPDATE passengers 
      SET has_boarded = true
      WHERE id = $1
      RETURNING *
    `;

    const updateResult = await db.query(updateQuery, [passenger.id]);

    res.json({
      success: true,
      message: 'Посадка подтверждена',
      passenger: {
        ...passenger,
        has_boarded: true
      },
      status: 'success'
    });

  } catch (error) {
    console.error('Ошибка сканирования:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});















module.exports = router;