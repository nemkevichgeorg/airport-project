import { useEffect, useState } from 'react';
import axios from 'axios';
import './GateBoard.css';

export default function GateBoard({ onBack }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('/display/gates').then(res => setData(res.data));
  }, []);

  return (
    <div className="board">
      <button onClick={onBack}>← Назад</button>
      <h2>Выходы на посадку</h2>

      <table>
        <thead>
          <tr>
            <th>Рейс</th>
            <th>Гейт</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {data.map(f => (
            <tr key={f.flight_number}>
              <td>{f.flight_number}</td>
              <td>{f.gate_number}</td>
              <td>{f.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
