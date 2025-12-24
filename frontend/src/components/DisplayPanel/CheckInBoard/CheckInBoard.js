import { useEffect, useState } from 'react';
import axios from 'axios';
import './CheckInBoard.css';

export default function CheckInBoard({ onBack }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('/display/checkin').then(res => setData(res.data));
  }, []);

  return (
    <div className="board">
      <button onClick={onBack}>← Назад</button>
      <h2>Стойки регистрации</h2>

      <table>
        <thead>
          <tr>
            <th>Рейс</th>
            <th>Стойки</th>
          </tr>
        </thead>
        <tbody>
          {data.map(f => (
            <tr key={f.flight_number}>
              <td>{f.flight_number}</td>
              <td>{f.desks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
