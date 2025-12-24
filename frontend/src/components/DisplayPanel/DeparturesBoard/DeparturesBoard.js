import { useEffect, useState } from 'react';
import axios from 'axios';
import './DeparturesBoard.css';

export default function DeparturesBoard({ onBack }) {
  const [flights, setFlights] = useState([]);

const load = async () => {
  const res = await axios.get('/display/departures');
  const allFlights = res.data;

  // Сегодняшняя дата в Москве
  const now = new Date();
  const moscowOffset = 3 * 60; // +3 часа
  const nowMoscow = new Date(now.getTime() + (moscowOffset - now.getTimezoneOffset()) * 60000);
  const todayMoscow = nowMoscow.toISOString().slice(0, 10);

  // Фильтруем рейсы по дате
  const flightsToday = allFlights.filter(f => {
    const dep = new Date(f.departure_time); // строку в Date
    const depMoscow = new Date(dep.getTime() + (moscowOffset - dep.getTimezoneOffset()) * 60000);
    return depMoscow.toISOString().slice(0, 10) === todayMoscow;
  });

  setFlights(flightsToday);
};

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
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
          {flights.map(f => (
            <tr key={f.flight_number} className={`status-${f.status}`}>
              <td>{f.flight_number}</td>
              <td>{new Date(f.departure_time).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Moscow',
              })}</td>
              <td>{f.gate_number ?? '—'}</td>
              <td>{f.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
