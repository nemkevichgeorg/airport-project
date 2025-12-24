import { useEffect, useState } from 'react';
import axios from 'axios';
import './DeparturesBoard.css';

export default function DeparturesBoard({ onBack }) {
  const [flights, setFlights] = useState([]);

  const load = async () => {
    const res = await axios.get('/display/departures');
    setFlights(res.data);
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
              <td>{new Date(f.departure_time).toLocaleTimeString('ru-RU')}</td>
              <td>{f.gate_number ?? '—'}</td>
              <td>{f.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
