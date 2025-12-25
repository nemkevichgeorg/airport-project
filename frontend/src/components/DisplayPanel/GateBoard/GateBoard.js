// frontend/src/components/DisplayPanel/GateBoard/GateBoard.js
import { useEffect, useState } from 'react';
import { displayAPI } from '../../../services/api';
import './GateBoard.css';

export default function GateBoard({ gate, onBack }) {
  const [flights, setFlights] = useState([]);

  const load = async () => {
    const res = await displayAPI.getDepartures();

    const filtered = res.data.filter(
      f =>
        f.gate_number === gate &&
        (f.status === 'boarding' || f.status === 'last_call')
    );

    setFlights(filtered);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [gate]);

  return (
    <div className="db-board fullscreen">
      <h2 className="db-title">GATE {gate}</h2>

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
              <td>{new Date(f.departure_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
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
