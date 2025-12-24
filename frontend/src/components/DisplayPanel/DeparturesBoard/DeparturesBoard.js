import { useEffect, useState } from 'react';
import { displayAPI } from '../../../services/api';
import './DeparturesBoard.css';

export default function DeparturesBoard({ onBack }) {
  const [flights, setFlights] = useState([]);

  const load = async () => {
    try {
      const res = await displayAPI.getDepartures();
      const allFlights = res.data;

      console.log(allFlights); // проверяем, что приходит с сервера

      // Сегодняшняя дата в Москве
      const now = new Date();
      const moscowOffset = 3 * 60; // +3 часа
      const nowMoscow = new Date(now.getTime() + (moscowOffset - now.getTimezoneOffset()) * 60000);
      const todayMoscow = nowMoscow.toISOString().slice(0, 10);

      // Фильтруем рейсы по сегодняшней дате
      const flightsToday = allFlights.filter(f => {
        const dep = new Date(f.departure_time);
        const depMoscow = new Date(dep.getTime() + (moscowOffset - dep.getTimezoneOffset()) * 60000);
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
      <h2>Departures</h2>
      <p>{new Date(Date.now()).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>


      <table>
        <thead>
          <tr>
            <th>TIME</th>
            <th>FLIGHT</th>
            <th>DESTINATION</th>
            <th>CHECK-IN DESKS</th>
            <th>GATE</th>
            <th>STATUS</th>
            <th>REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {flights.map(f => {
            const departureTime = new Date(f.departure_time);

            return (
              <tr key={f.flight_number} className={`status-${f.status}`}>
                <td>{departureTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                <td>{f.flight_number}</td>
                <td>{`${f.arrival_city} (${f.arrival_airport})`.toUpperCase()}</td>
                <td>{f.checkin_desks}</td>
                <td>{f.gate_number}</td>
                <td>{`${f.status}`.toUpperCase()}</td>
                <td>
                  {f.is_delayed && f.delayed_departure_time
                    ? `DELAYED UNTIL ${new Date(f.delayed_departure_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
