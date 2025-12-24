const express = require('express');
const pool = require('../../db');
const router = express.Router();

/**
 * Общее табло вылетов
 */
router.get('/departures', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.flight_number,
        f.departure_time,
        f.delayed_departure_time,
        f.is_delayed,
        f.status,
        f.arrival_airport,
        g.gate_number,
        a.city AS arrival_city
      FROM flights f
      LEFT JOIN gates g ON f.gate_id = g.id
      LEFT JOIN airports a ON f.arrival_airport = a.iata_code
      ORDER BY f.departure_time
    `);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка загрузки табло' });
  }
});






/**
 * Табло стоек регистрации
 */
router.get('/checkin', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.flight_number,
        STRING_AGG(cd.desk_number, ', ' ORDER BY cd.desk_number) AS desks
      FROM flights f
      JOIN flight_check_in_desks fcd ON f.id = fcd.flight_id
      JOIN check_in_desks cd ON fcd.check_in_desk_id = cd.id
      WHERE f.departure_time >= NOW() - INTERVAL '1 hour'
      GROUP BY f.flight_number
      ORDER BY f.flight_number
    `);

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка загрузки стоек' });
  }
});

/**
 * Табло выходов на посадку
 */
router.get('/gates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.flight_number,
        g.gate_number,
        f.status
      FROM flights f
      JOIN gates g ON f.gate_id = g.id
      WHERE f.departure_time >= NOW() - INTERVAL '1 hour'
      ORDER BY g.gate_number
    `);

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка загрузки гейтов' });
  }
});

module.exports = router;
