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
      <h2 className="ch-db-title">{desk}</h2>
      <h2 className="ch-db-title-status">CHECK-IN</h2>
      <p className="ch-db-timestamp">
        {new Date(Date.now()).toLocaleString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour12: false
        }).toUpperCase()}
      </p>

      <table className="ch-db-table">
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
            <tr key={f.flight_number} className={"ch-db-row"}>
              <td className="ch-db-time">
                {new Date(f.departure_time).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="ch-db-flight">{f.flight_number}</td>
              <td className="ch-db-destination">{`${f.arrival_city} (${f.arrival_airport})`.toUpperCase()}</td>
              <td className="ch-db-remarks">
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
