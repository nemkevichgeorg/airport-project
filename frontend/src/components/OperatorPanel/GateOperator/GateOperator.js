// frontend\src\components\OperatorPanel\GateOperator\GateScanner.js
import React, { useState, useRef, useEffect } from 'react';
import { operatorAPI } from '../../../services/api';
import './GateOperator.css';

const GateScanner = ({ gateNumber, onBack }) => {
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [currentFlight, setCurrentFlight] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Загружаем информацию о рейсе на гейте
    loadCurrentFlight();
    // Фокусируемся на поле ввода при загрузке
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [gateNumber]);

  const loadCurrentFlight = async () => {
    try {
      // Получаем активные рейсы и находим рейс для этого гейта
      const response = await operatorAPI.getActiveFlights();
      const activeFlights = response.data;
      
      // Ищем активный рейс для этого гейта
      let flight = null;
      
      // Проверяем активные рейсы на гейтах (boarding, last_call)
      if (activeFlights.gate[gateNumber] && activeFlights.gate[gateNumber].length > 0) {
        flight = activeFlights.gate[gateNumber][0];
      }
      // Если нет активных, проверяем запланированные
      else if (activeFlights.gateScheduled[gateNumber] && activeFlights.gateScheduled[gateNumber].length > 0) {
        flight = activeFlights.gateScheduled[gateNumber][0];
      }
      
      setCurrentFlight(flight);
    } catch (error) {
      console.error('Ошибка загрузки информации о рейсе:', error);
    }
  };

  const handleScan = async (boardingPassNumber) => {
    if (!boardingPassNumber.trim()) return;

    setIsLoading(true);
    setScanResult(null);

    try {
      const response = await operatorAPI.scanBoardingPass(boardingPassNumber);
      
      setScanResult({
        success: true,
        passenger: response.data.passenger,
        message: response.data.message
      });

      // Добавляем в историю
      setScanHistory(prev => [{
        ...response.data.passenger,
        timestamp: new Date(),
        success: true
      }, ...prev.slice(0, 9)]); // Последние 10 сканирований

    } catch (error) {
      const errorData = error.response?.data;
      setScanResult({
        success: false,
        message: errorData?.error || 'Ошибка сканирования',
        passenger: errorData?.passenger,
        status: errorData?.status
      });
    } finally {
      setIsLoading(false);
      setManualInput('');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleScan(manualInput);
  };

  const handleKeyPress = (e) => {
    // Автоматически обрабатываем ввод как сканирование
    if (e.key === 'Enter' && manualInput) {
      handleScan(manualInput);
    }
  };

  const getStatusMessage = () => {
    if (!scanResult) return null;

    if (scanResult.success) {
      return { type: 'success', message: scanResult.message };
    }

    switch (scanResult.status) {
      case 'already_boarded':
        return { type: 'warning', message: 'Уже прошел посадку' };
      case 'not_checked_in':
        return { type: 'error', message: 'Не зарегистрирован' };
      case 'boarding_not_active':
        return { type: 'error', message: 'Посадка не активна' };
      default:
        return { type: 'error', message: scanResult.message };
    }
  };

  const formatFlightTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFlightStatusText = (status) => {
    const statusMap = {
      'scheduled': 'По расписанию',
      'check_in': 'Регистрация',
      'boarding': 'Посадка',
      'last_call': 'Последний вызов',
      'departed': 'Вылетел'
    };
    return statusMap[status] || status;
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="gate-scanner">
      <header className="scanner-header">
        <div className="header-top">
          <div className="gate-info">
            <h2>Сканер посадки • Гейт {gateNumber}</h2>
            {currentFlight && (
              <div className="flight-details">
                <span className="flight-number">{currentFlight.flight_number}</span>
                <span className="flight-route">
                  → {currentFlight.arrival_airport}
                </span>
                <span className="flight-time">
                  {formatFlightTime(currentFlight.departure_time)}
                </span>
                <span className={`flight-status ${currentFlight.status}`}>
                  {getFlightStatusText(currentFlight.status)}
                </span>
              </div>
            )}
          </div>
          <button onClick={onBack} className="back-button">← Назад к гейтам</button>
        </div>

        {!currentFlight && (
          <div className="no-flight-warning">
            ⚠️ На этом гейте нет активных рейсов
          </div>
        )}
      </header>

      {/* Основная область сканирования */}
      <div className="scanner-main">
        <div className="scan-input-section">
          <form onSubmit={handleManualSubmit} className="scan-form">
            <label htmlFor="boardingPassInput">
              {currentFlight ? 
                `Сканируйте посадочный талон рейса ${currentFlight.flight_number}:` : 
                'Сканируйте посадочный талон:'}
            </label>
            <input
              ref={inputRef}
              id="boardingPassInput"
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Введите номер посадочного талона..."
              disabled={isLoading}
              autoComplete="off"
              className="scan-input"
            />
            <button 
              type="submit" 
              disabled={!manualInput || isLoading}
              className="scan-button"
            >
              {isLoading ? 'Сканирование...' : 'Проверить'}
            </button>
          </form>
        </div>

        {/* Результат сканирования */}
        {scanResult && (
          <div className={`scan-result ${statusInfo.type}`}>
            <div className="result-icon">
              {statusInfo.type === 'success' ? '✅' : 
               statusInfo.type === 'warning' ? '⚠️' : '❌'}
            </div>
            <div className="result-content">
              <h3>{statusInfo.message}</h3>
              
              {scanResult.passenger && (
                <div className="passenger-info">
                  <div className="passenger-name">
                    {scanResult.passenger.first_name} {scanResult.passenger.last_name}
                  </div>
                  <div className="flight-info">
                    Рейс: {scanResult.passenger.flight_number} → {scanResult.passenger.arrival_airport}
                  </div>
                  <div className="seat-info">
                    Место: {scanResult.passenger.seat_number || 'Не назначено'}
                  </div>
                  {scanResult.passenger.gate_number && (
                    <div className="gate-info">
                      Гейт: {scanResult.passenger.gate_number}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* История сканирований */}
      {scanHistory.length > 0 && (
        <div className="scan-history">
          <h3>Последние сканирования:</h3>
          <div className="history-list">
            {scanHistory.map((item, index) => (
              <div key={index} className="history-item success">
                <span className="time">
                  {item.timestamp.toLocaleTimeString('ru-RU')}
                </span>
                <span className="name">{item.first_name} {item.last_name}</span>
                <span className="flight">{item.flight_number}</span>
                <span className="seat">{item.seat_number}</span>
                <span className="status">✅ Посажен</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GateScanner;