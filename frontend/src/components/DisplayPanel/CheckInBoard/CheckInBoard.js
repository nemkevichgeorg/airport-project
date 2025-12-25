// frontend/src/components/DisplayPanel/CheckInBoard/CheckInBoard.js
import { useEffect, useState } from 'react';
import { displayAPI } from '../../../services/api';
import './CheckInBoard.css';

export default function CheckInBoard({ desk, onBack }) {
  const [flights, setFlights] = useState([]);

  const load = async () => {
    const res = await displayAPI.getCheckInBoard(desk);
    setFlights(res.data);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [desk]);

  return (
    <div className="db-board fullscreen">
      <h2 className="db-title">CHECK-IN DESK {desk}</h2>

      <table className="db-table">
        <thead>
          <tr>
            <th>TIME</th>
            <th>FLIGHT</th>
            <th>DESTINATION</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {flights.map(f => (
            <tr key={f.flight_number} className={`db-row db-status-${f.status}`}>
              <td>
                {new Date(f.departure_time).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td>{f.flight_number}</td>
              <td>{`${f.arrival_city} (${f.arrival_airport})`.toUpperCase()}</td>
              <td className="db-status">{f.status.toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="db-back-btn" onClick={onBack}>
        Назад
      </button>
    </div>
  );
}
