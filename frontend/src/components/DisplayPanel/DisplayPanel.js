// frontend/src/components/DisplayPanel/DisplayPanel.js
import React, { useState } from 'react';
import DeparturesBoard from './DeparturesBoard/DeparturesBoard';
import CheckInBoard from './CheckInBoard/CheckInBoard';
import GateBoard from './GateBoard/GateBoard';
import './DisplayPanel.css';

function DisplayPanel() {
  const [mode, setMode] = useState(null);

  if (mode === 'departures') return <DeparturesBoard />;
  if (mode === 'checkin') return <CheckInBoard />;
  if (mode === 'gate') return <GateBoard />;

  return (
    <div className="display-panel">
      <h2>Выбор экрана</h2>

      <button onClick={() => setMode('departures')}>
        📋 Общее табло вылетов
      </button>

      <button onClick={() => setMode('checkin')}>
        🛄 Табло стоек регистрации
      </button>

      <button onClick={() => setMode('gate')}>
        ✈️ Табло выходов на посадку
      </button>
    </div>
  );
}

export default DisplayPanel;
