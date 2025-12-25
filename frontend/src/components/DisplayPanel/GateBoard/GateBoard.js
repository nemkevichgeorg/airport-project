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
      <h2 className="g-db-title">{gate}</h2>
      <h2 className="g-db-title-status">BOARDING</h2>
      <p className="g-db-timestamp">
        {new Date(Date.now()).toLocaleString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour12: false
        }).toUpperCase()}
      </p>
      <table className="g-table">
        <thead>
          <tr>
            <th>TIME</th>
            <th>FLIGHT</th>
            <th>DESTINATION</th>
            <th>REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {flights.map(f => (
            <tr key={f.flight_number} className={"g-db-row"}>
              <td className="g-db-time">{new Date(f.departure_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
              <td className="g-db-flight">{f.flight_number}</td>
              <td className="g-db-destination">{`${f.arrival_city} (${f.arrival_airport})`.toUpperCase()}</td>
              <td className="g-db-remarks">
                {f.is_delayed && f.delayed_departure_time
                  ? `DELAYED UNTIL ${new Date(f.delayed_departure_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="db-back-btn" onClick={onBack}>
        Назад к выбору дисплея
      </button>
    </div>
  );
}
