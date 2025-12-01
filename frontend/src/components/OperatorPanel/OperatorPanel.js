// frontend/src/components/OperatorPanel.js
import React, { useState, useEffect, useRef } from 'react';
import { operatorAPI } from '../../services/api';
import './OperatorPanel.css';

const OperatorPanel = ({ onOpenDesk, onOpenGate }) => { // ← Добавляем пропсы
  const [checkInDesks, setCheckInDesks] = useState([]);
  const [gates, setGates] = useState([]);
  const [activeFlights, setActiveFlights] = useState({
    checkin: {},
    scheduled: {},
    gate: {},
    gateScheduled: {}
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Используем useRef для хранения таймера
  const refreshTimerRef = useRef(null);

  // Функция загрузки всех данных
  const loadAllData = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [desksRes, gatesRes, flightsRes] = await Promise.all([
        operatorAPI.getCheckInDesks(),
        operatorAPI.getGates(),
        operatorAPI.getActiveFlights()
      ]);
      
      setCheckInDesks(desksRes.data);
      setGates(gatesRes.data);
      
      const data = flightsRes.data || {
        checkin: {},
        scheduled: {},
        gate: {},
        gateScheduled: {}
      };
      setActiveFlights(data);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка при монтировании
  useEffect(() => {
    loadAllData();
    
    // Настраиваем автоматическое обновление каждые 10 секунд
    refreshTimerRef.current = setInterval(() => {
      loadAllData();
    }, 10000); // 10 секунд

    // Очистка при размонтировании
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  // Функция ручного обновления
  const handleManualRefresh = () => {
    loadAllData();
  };

  // Безопасные функции с проверками
  const getActiveFlightsForDesk = (deskNumber) => {
    return (activeFlights.checkin && activeFlights.checkin[deskNumber]) || [];
  };

  const getScheduledFlightsForDesk = (deskNumber) => {
    return (activeFlights.scheduled && activeFlights.scheduled[deskNumber]) || [];
  };

  const getActiveFlightsForGate = (gateNumber) => {
    return (activeFlights.gate && activeFlights.gate[gateNumber]) || [];
  };

  const getScheduledFlightsForGate = (gateNumber) => {
    return (activeFlights.gateScheduled && activeFlights.gateScheduled[gateNumber]) || [];
  };

  // Обновленные функции открытия окон - используем пропсы
  const openDeskWindow = (deskNumber) => {
    if (onOpenDesk) {
      onOpenDesk(deskNumber); // ← Вызываем функцию из пропсов
    } else {
      // Фолбэк на случай если пропс не передан
      window.open(`/operator/desk/${deskNumber}`, `desk-${deskNumber}`, 'width=1200,height=800');
    }
  };

  const openGateWindow = (gateNumber) => {
    if (onOpenGate) {
      onOpenGate(gateNumber); // ← Вызываем функцию из пропсов
    } else {
      // Фолбэк
      window.open(`/operator/gate/${gateNumber}`, `gate-${gateNumber}`, 'width=1200,height=800');
    }
  };

  const FlightList = ({ flights, title, emptyMessage }) => (
    <div className="flight-section">
      <strong>{title}:</strong>
      {flights && flights.length > 0 ? (
        flights.map(flight => (
          <div key={flight.id} className="flight-info">
            <span className="flight-number">{flight.flight_number}</span>
            <span className="flight-destination">→ {flight.arrival_airport}</span>
            <span className="flight-time">
              {new Date(flight.departure_time).toLocaleTimeString()}
            </span>
            <span className={`status status-${flight.status}`}>
              {flight.status}
            </span>
          </div>
        ))
      ) : (
        <span className="no-flights">{emptyMessage}</span>
      )}
    </div>
  );

  // Форматирование времени последнего обновления
  const formatLastUpdate = (date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="operator-panel">
      <header className="operator-header">
        <div className="header-top">
          <h2>Панель оператора</h2>
          <div className="refresh-info">
            <span className="last-update">
              Обновлено: {formatLastUpdate(lastUpdate)}
            </span>
            <button 
              onClick={handleManualRefresh}
              className="refresh-button"
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '⟳'} Обновить
            </button>
          </div>
        </div>
        <p>Выберите стойку регистрации или гейт для работы</p>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </header>

      <main className="operator-main">
        {/* Секция стоек регистрации */}
        <section className="section">
          <h3>🎫 Стойки регистрации</h3>
          <div className="grid-container">
            {checkInDesks.map(desk => (
              <div key={desk.id} className="card">
                <div className="card-header">
                  <h4>Стойка {desk.desk_number}</h4>
                  <span className="description">{desk.description}</span>
                </div>
                
                <div className="card-content">
                  <FlightList 
                    flights={getActiveFlightsForDesk(desk.desk_number)}
                    title="Активные рейсы"
                    emptyMessage="Нет активных рейсов"
                  />
                  
                  <FlightList 
                    flights={getScheduledFlightsForDesk(desk.desk_number)}
                    title="Запланированные рейсы"
                    emptyMessage="Нет запланированных рейсов"
                  />
                </div>

                <div className="card-actions">
                  <button 
                    onClick={() => openDeskWindow(desk.desk_number)}
                    className="action-button"
                    disabled={getActiveFlightsForDesk(desk.desk_number).length === 0}
                  >
                    Перейти к стойке
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Секция гейтов */}
        <section className="section">
          <h3>✈️ Гейты посадки</h3>
          <div className="grid-container">
            {gates.map(gate => (
              <div key={gate.id} className="card">
                <div className="card-header">
                  <h4>Гейт {gate.gate_number}</h4>
                  <span className="description">{gate.description}</span>
                </div>
                
                <div className="card-content">
                  <FlightList 
                    flights={getActiveFlightsForGate(gate.gate_number)}
                    title="Активные рейсы"
                    emptyMessage="Нет активных рейсов"
                  />
                  
                  <FlightList 
                    flights={getScheduledFlightsForGate(gate.gate_number)}
                    title="Запланированные рейсы"
                    emptyMessage="Нет запланированных рейсов"
                  />
                </div>

                <div className="card-actions">
                  <button 
                    onClick={() => openGateWindow(gate.gate_number)}
                    className="action-button"
                    disabled={getActiveFlightsForGate(gate.gate_number).length === 0}
                  >
                    Перейти к гейту
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default OperatorPanel;