// // frontend\src\components\DisplayPanel\DisplayPanel.js
// import { useState } from 'react';
// import { displayAPI } from '../../services/api';
// import DeparturesBoard from './DeparturesBoard/DeparturesBoard';
// import CheckInBoard from './CheckInBoard/CheckInBoard';
// import GateBoard from './GateBoard/GateBoard';
// import './DisplayPanel.css';

// export default function DisplayPanel() {
//   const [mode, setMode] = useState(null);

//   if (mode === 'departures') return <DeparturesBoard onBack={() => setMode(null)} />;
//   if (mode === 'checkin') return <CheckInBoard onBack={() => setMode(null)} />;
//   if (mode === 'gates') return <GateBoard onBack={() => setMode(null)} />;

//   return (
//     <div className="display-panel">
//       <h2>Выбор экрана табло</h2>
//       <button onClick={() => setMode('departures')}>
//         Общее табло вылетов
//       </button>

//       <button onClick={() => setMode('checkin')}>
//         Табло стоек регистрации
//       </button>

//       <button onClick={() => setMode('gates')}>
//         Табло выходов на посадку
//       </button>
//     </div>
//   );
// }

// frontend/src/components/DisplayPanel/DisplayPanel.js
import { useEffect, useState } from 'react';
import { displayAPI } from '../../services/api';
import DeparturesBoard from './DeparturesBoard/DeparturesBoard';
import CheckInBoard from './CheckInBoard/CheckInBoard';
import GateBoard from './GateBoard/GateBoard';
import './DisplayPanel.css';

export default function DisplayPanel() {
  const [mode, setMode] = useState(null);
  const [checkInDesks, setCheckInDesks] = useState([]);
  const [gates, setGates] = useState([]);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [selectedGate, setSelectedGate] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await displayAPI.getDepartures();

      // уникальные стойки и гейты из БД
      setCheckInDesks(
        [...new Set(res.data.map(f => f.checkin_desks).filter(Boolean))]
      );

      setGates(
        [...new Set(res.data.map(f => f.gate_number).filter(Boolean))]
      );
    };

    load();
  }, []);

  if (mode === 'departures')
    return <DeparturesBoard onBack={() => setMode(null)} />;

  if (mode === 'checkin')
    return (
      <CheckInBoard
        desk={selectedDesk}
        onBack={() => setMode(null)}
      />
    );

  if (mode === 'gate')
    return (
      <GateBoard
        gate={selectedGate}
        onBack={() => setMode(null)}
      />
    );

  return (
    <div className="display-panel">
      <h2>ВЫБОР ЭКРАНА ТАБЛО</h2>

      <button onClick={() => setMode('departures')}>
        ОБЩЕЕ ТАБЛО ВЫЛЕТОВ
      </button>

      <h3>СТОЙКИ РЕГИСТРАЦИИ</h3>
      <div className="display-buttons">
        {checkInDesks.map(desk => (
          <button
            key={desk}
            onClick={() => {
              setSelectedDesk(desk);
              setMode('checkin');
            }}
          >
            СТОЙКА {desk}
          </button>
        ))}
      </div>

      <h3>ВЫХОДЫ НА ПОСАДКУ</h3>
      <div className="display-buttons">
        {gates.map(gate => (
          <button
            key={gate}
            onClick={() => {
              setSelectedGate(gate);
              setMode('gate');
            }}
          >
            GATE {gate}
          </button>
        ))}
      </div>
    </div>
  );
}

