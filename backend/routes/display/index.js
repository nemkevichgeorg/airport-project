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
              a.city AS arrival_city,
              STRING_AGG(cd.desk_number, ', ' ORDER BY cd.desk_number) AS checkin_desks
            FROM flights f
            LEFT JOIN gates g ON f.gate_id = g.id
            LEFT JOIN airports a ON TRIM(f.arrival_airport) = a.iata_code
            LEFT JOIN flight_check_in_desks fcd ON f.id = fcd.flight_id
            LEFT JOIN check_in_desks cd ON fcd.check_in_desk_id = cd.id
            GROUP BY f.flight_number, f.departure_time, f.delayed_departure_time, f.is_delayed, f.status, f.arrival_airport, g.gate_number, a.city
            ORDER BY f.departure_time
    `);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка загрузки табло' });
  }
});



/**
 * Список стоек регистрации
 */
router.get('/checkin/desks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT cd.desk_number
      FROM check_in_desks cd
      ORDER BY cd.desk_number
    `);

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка загрузки стоек' });
  }
});



/**
 * Табло конкретной стойки регистрации
 */
router.get('/checkin/:desk', async (req, res) => {
  const { desk } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        f.flight_number,
        f.departure_time,
        f.delayed_departure_time,
        f.is_delayed,
        f.status,
        a.city AS arrival_city,
        f.arrival_airport
      FROM flights f
      JOIN flight_check_in_desks fcd ON f.id = fcd.flight_id
      JOIN check_in_desks cd ON fcd.check_in_desk_id = cd.id
      LEFT JOIN airports a ON TRIM(f.arrival_airport) = a.iata_code
      WHERE
        cd.desk_number = $1
        AND f.status = 'check_in'
      ORDER BY f.departure_time
    `, [desk]);

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка загрузки табло стойки' });
  }
});



/**
 * Список гейтов
 */
router.get('/gates/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT gate_number
      FROM gates
      ORDER BY gate_number
    `);

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка загрузки гейтов' });
  }
});




/**
 * Табло конкретного гейта
 */
router.get('/gates/:gate', async (req, res) => {
  const { gate } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        f.flight_number,
        f.departure_time,
        f.delayed_departure_time,
        f.is_delayed,
        f.status,
        a.city AS arrival_city,
        f.arrival_airport
      FROM flights f
      JOIN gates g ON f.gate_id = g.id
      LEFT JOIN airports a ON TRIM(f.arrival_airport) = a.iata_code
      WHERE
        g.gate_number = $1
        AND f.status IN ('boarding', 'last_call')
      ORDER BY f.departure_time
    `, [gate]);

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка загрузки табло гейта' });
  }
});

module.exports = router;