import { useState } from 'react';
import DeparturesBoard from './DeparturesBoard/DeparturesBoard';
import CheckInBoard from './CheckInBoard/CheckInBoard';
import GateBoard from './GateBoard/GateBoard';
import './DisplayPanel.css';

export default function DisplayPanel() {
  const [mode, setMode] = useState(null);

  if (mode === 'departures') return <DeparturesBoard onBack={() => setMode(null)} />;
  if (mode === 'checkin') return <CheckInBoard onBack={() => setMode(null)} />;
  if (mode === 'gates') return <GateBoard onBack={() => setMode(null)} />;

  return (
    <div className="display-panel">
      <h2>Выбор экрана табло</h2>

      <button onClick={() => setMode('departures')}>
        Общее табло вылетов
      </button>

      <button onClick={() => setMode('checkin')}>
        Табло стоек регистрации
      </button>

      <button onClick={() => setMode('gates')}>
        Табло выходов на посадку
      </button>
    </div>
  );
}
