import { useEffect, useState } from 'react';
import { displayAPI } from '../../../services/api';
import './DeparturesBoard.css';

export default function DeparturesBoard({ onBack }) {
  const [flights, setFlights] = useState([]);

  const load = async () => {
    try {
      const res = await displayAPI.getDepartures();
      const allFlights = res.data;

      // Сегодняшняя дата в Москве
      const now = new Date();
      const moscowOffset = 3 * 60; // +3 часа
      const nowMoscow = new Date(now.getTime() + (moscowOffset - now.getTimezoneOffset()) * 60000);
      const todayMoscow = nowMoscow.toISOString().slice(0, 10);

      // Фильтруем рейсы по сегодняшней дате
      const flightsToday = allFlights.filter(f => {
        const timeToCheck = f.is_delayed === true || f.is_delayed === 't'
          ? new Date(f.delayed_departure_time)
          : new Date(f.departure_time);

        const depMoscow = new Date(timeToCheck.getTime() + (moscowOffset - timeToCheck.getTimezoneOffset()) * 60000);
        return depMoscow.toISOString().slice(0, 10) === todayMoscow;
      });

      setFlights(flightsToday);
    } catch (error) {
      console.error('Ошибка загрузки табло:', error);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000); // обновление каждые 10 секунд
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="board">
      <button onClick={onBack}>← Назад</button>
      <h2>Табло вылетов</h2>

      <table>
        <thead>
          <tr>
            <th>Рейс</th>
            <th>Время</th>
            <th>Гейт</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {flights.map(f => {
            const departureTime = new Date(f.departure_time);
            const delayedTime = f.delayed_departure_time ? new Date(f.delayed_departure_time) : null;
            const isDelayed = f.is_delayed === true || f.is_delayed === 't';

            return (
              <tr 
                key={f.flight_number} 
                className={`status-${f.status} ${isDelayed ? 'status-delayed' : ''}`}
              >
                <td>{f.flight_number}</td>
                <td>
                  {isDelayed && delayedTime ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#999' }}>
                        {departureTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <br />
                      <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                        {delayedTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} ⚠️
                      </span>
                    </>
                  ) : (
                    departureTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                  )}
                </td>
                <td>{f.gate_number ?? '—'}</td>
                <td>
                  <span className={`status-badge status-${f.status}`}>
                    {f.status}
                    {isDelayed && ' ⚠️'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
