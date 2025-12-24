// frontend/src/components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { managementAPI, adminAPI } from '../../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [flights, setFlights] = useState([]);
  const [gates, setGates] = useState([]);
  const [checkInDesks, setCheckInDesks] = useState([]);
  const [message, setMessage] = useState('');
  const [airports, setAirports] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);

  const [flightData, setFlightData] = useState({
    flight_number: '',
    arrival_airport: '',
    departure_time: '',
    gate_id: '',
    check_in_desk_ids: [],
    aircraft_type: ''
  });

  const [gateData, setGateData] = useState({
    gate_number: '',
    description: ''
  });

  const [deskData, setDeskData] = useState({
    desk_number: '',
    description: ''
  });

  useEffect(() => {
    loadData();
    loadAircraftTypes();
  }, []);

  const loadAircraftTypes = async () => {
    try {
      const response = await adminAPI.getAircraftTypes();
      setAircraftTypes(response.data);
    } catch (error) {
      console.error('Ошибка загрузки типов самолетов:', error);
    }
  };

  const loadData = async () => {
    try {
      const [flightsRes, gatesRes, desksRes] = await Promise.all([
        adminAPI.getFlights(),
        managementAPI.getGates(),
        managementAPI.getCheckInDesks()
      ]);
      
      setFlights(flightsRes.data);
      setGates(gatesRes.data);
      setCheckInDesks(desksRes.data);
    } catch (error) {
      setMessage('Ошибка загрузки данных');
    }
  };

  const searchAirports = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setAirports([]);
      return;
    }
    
    try {
      const response = await adminAPI.searchAirports(searchTerm);
      setAirports(response.data);
    } catch (error) {
      console.error('Ошибка поиска аэропортов:', error);
      setAirports([]);
    }
  };
  
  const sortedFlights = [...flights].sort((a, b) => {
    const timeA = new Date(a.delayed_departure_time || a.departure_time);
    const timeB = new Date(b.delayed_departure_time || b.departure_time);
    return timeB - timeA; // DESC — новые сверху
  });

  const handleCreateFlight = async (e) => {
    e.preventDefault();
    console.log('🛫 Отправка данных:', flightData);
    console.log('📦 check_in_desk_ids:', flightData.check_in_desk_ids);
    try {
      const response = await adminAPI.createFlight(flightData);
      console.log('✅ Ответ сервера:', response.data);
      
      setMessage('Рейс успешно создан!');
      setFlightData({
        flight_number: '',
        arrival_airport: '',
        departure_time: '',
        gate_id: '',
        check_in_desk_ids: [],
        aircraft_type: ''
      });
      loadData();
      setActiveTab('flights'); // Переключаемся на вкладку со списком рейсов
    } catch (error) {
      console.error('❌ Ошибка:', error.response?.data);
      setMessage('Ошибка создания рейса: ' + (error.response?.data?.error || error.message));
    }
  };

const handleCreateGate = async (e) => {
    e.preventDefault();
    try {
      await managementAPI.createGate(gateData);
      setMessage('Гейт успешно создан!');
      setGateData({ gate_number: '', description: '' });
      loadData();
    } catch (error) {
      setMessage('Ошибка создания гейта: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCreateDesk = async (e) => {
    e.preventDefault();
    console.log('📦 Данные для создания стойки:', deskData);
    try {
      await managementAPI.createCheckInDesk(deskData);
      setMessage('Стойка регистрации успешно создана!');
      setDeskData({ desk_number: '', description: '' });
      loadData();
    } catch (error) {
      console.error('❌ Ошибка создания стойки:', error.response?.data);
      setMessage('Ошибка создания стойки: ' + (error.response?.data?.error || error.message));
    }
  };

  // Функция смены статуса
const updateFlightStatus = async (flightId, status) => {
  try {
    await adminAPI.updateFlightStatus(flightId, { status });
    setMessage(`Статус рейса обновлен на: ${getStatusText(status)}`);
    loadData(); // Перезагружаем данные
  } catch (error) {
    setMessage('Ошибка обновления статуса: ' + error.response?.data?.error);
  }
};

// Функция для отображения текста статуса
const getStatusText = (status) => {
  const statusMap = {
    'scheduled': 'Запланирован',
    'check_in': 'Регистрация',
    'boarding': 'Посадка',
    'last_call': 'LAST CALL',
    'completed': 'Посадка завершена',
    'cancelled': 'Отменен',
    'departed': 'Вылетел'
  };
  return statusMap[status] || status;
};



// Функция задержки рейса (каждый раз новое время)
const delayFlight = async (flight) => {
  try {
    // Всегда запрашиваем новое время
    const newTime = prompt(
      'Введите новое время вылета (формат: YYYY-MM-DDTHH:MM):', 
      flight.delayed_departure_time || flight.departure_time
    );
    if (!newTime) return; // Отмена
    
    await adminAPI.delayFlight(flight.id, { 
      delayed_departure_time: newTime 
    });
    
    setMessage('Время вылета обновлено');
    loadData();
  } catch (error) {
    setMessage('Ошибка: ' + (error.response?.data?.error || error.message));
  }
};

const [passengerStats, setPassengerStats] = useState({});

// Функция загрузки пассажиров
const uploadPassengers = async (flightId, file) => {
  const formData = new FormData();
  formData.append('csvFile', file);
  
  try {
    const response = await adminAPI.uploadPassengers(flightId, formData);
    setMessage(response.data.message);
    loadPassengerStats(flightId); // Обновляем статистику
    loadData(); // Перезагружаем рейсы
  } catch (error) {
    setMessage('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
  }
};

// Функция загрузки статистики
const loadPassengerStats = async (flightId) => {
  try {
    const response = await adminAPI.getPassengerStats(flightId);
    setPassengerStats(prev => ({
      ...prev,
      [flightId]: response.data
    }));
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

// Загружаем статистику при загрузке рейсов
useEffect(() => {
  if (flights.length > 0) {
    flights.forEach(flight => {
      loadPassengerStats(flight.id);
    });
  }
}, [flights]);

// Функция обновления гейта по названию
const updateFlightGate = async (flight) => {
  const currentGate = gates.find(g => g.id === flight.gate_id);
  const newGateNumber = prompt(
    'Введите номер гейта (например: A15, B2):', 
    currentGate ? currentGate.gate_number : ''
  );
  
  if (!newGateNumber) return;

  try {
    await adminAPI.updateFlightGate(flight.id, { gate_number: newGateNumber.trim() });
    setMessage(`Гейт рейса изменен на ${newGateNumber}`);
    loadData();
  } catch (error) {
    setMessage('Ошибка обновления гейта: ' + (error.response?.data?.error || error.message));
  }
};

// Функция обновления стоек по номерам
const updateFlightDesks = async (flight) => {
  // Получаем текущие номера стоек
  const currentDesks = checkInDesks.filter(desk => 
    flight.desk_numbers && flight.desk_numbers.includes(desk.desk_number)
  ).map(desk => desk.desk_number);
  
  const desksInput = prompt(
    'Введите номера стоек через запятую (например: A01, B12, C05):',
    currentDesks.join(', ')
  );
  
  if (!desksInput) return;

  try {
    const deskNumbers = desksInput.split(',')
      .map(num => num.trim())
      .filter(num => num !== '');
    
    await adminAPI.updateFlightDesks(flight.id, { desk_numbers: deskNumbers });
    setMessage(`Стойки регистрации обновлены: ${deskNumbers.join(', ')}`);
    loadData();
  } catch (error) {
    setMessage('Ошибка обновления стоек: ' + (error.response?.data?.error || error.message));
  }
};


  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h2>Панель администратора</h2>
      </header>

      <nav className="admin-navigation">
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'flights' ? 'active' : ''}`}
            onClick={() => setActiveTab('flights')}
          >
            Список рейсов
          </button>
          <button 
            className={`tab-button ${activeTab === 'create-flight' ? 'active' : ''}`}
            onClick={() => setActiveTab('create-flight')}
          >
            Создание рейса
          </button>
          <button 
            className={`tab-button ${activeTab === 'gates' ? 'active' : ''}`}
            onClick={() => setActiveTab('gates')}
          >
            Управление гейтами
          </button>
          <button 
            className={`tab-button ${activeTab === 'desks' ? 'active' : ''}`}
            onClick={() => setActiveTab('desks')}
          >
            Управление стойками
          </button>
        </div>
      </nav>

      {message && (
        <div className="message-container">
          <div className="message">{message}</div>
        </div>
      )}

      <main className="admin-main">
        {/* Вкладка со списком рейсов */}
        {activeTab === 'flights' && (
          <section className="tab-section">
            <div className="section-header">
              <h3>Список рейсов</h3>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Рейс</th>
                    <th>Направление</th>
                    <th>Вылет</th>
                    <th>Гейт</th>
                    <th>Стойки</th>
                    <th>Самолет</th>
                    <th>Статус</th>
                    <th>Пассажиры</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFlights.map(flight => (
                    <tr key={flight.id}>
                      <td>{flight.flight_number}</td>
                      <td>MOW → {flight.arrival_airport}</td>
                      <td>
                        {flight.is_delayed && flight.delayed_departure_time ? (
                          <>
                            <span style={{textDecoration: 'line-through', color: '#999'}}>
                              {new Date(flight.departure_time).toLocaleString()}
                            </span>
                            <br />
                            <span style={{color: '#d32f2f', fontWeight: 'bold'}}>
                              {new Date(flight.delayed_departure_time).toLocaleString()} ⚠️
                            </span>
                          </>
                        ) : (
                          new Date(flight.departure_time).toLocaleString()
                        )}
                      </td>
                      <td>{flight.gate_number || '-'}</td>
                      <td>{flight.desk_numbers || '-'}</td>
                      <td>{flight.aircraft_type || '-'}</td>
                      <td>
                        <span className={`status-badge status-${flight.status}`}>
                          {getStatusText(flight.status)}
                          {flight.is_delayed && ' ⚠️'}
                        </span>
                      </td>
                      <td>
                        {passengerStats[flight.id] ? (
                          <div className="passenger-stats">
                            <div>Бизнес: {passengerStats[flight.id].business}</div>
                            <div>Эконом: {passengerStats[flight.id].economy}</div>
                          </div>
                        ) : (
                          'Загрузка...'
                        )}
                        
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              uploadPassengers(flight.id, e.target.files[0]);
                              e.target.value = '';
                            }
                          }}
                          style={{marginTop: '5px', fontSize: '12px'}}
                        />
                      </td>
                      <td>
                        <div className="flight-actions">
                          <select 
                            value={flight.status} 
                            onChange={(e) => updateFlightStatus(flight.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="scheduled">Запланирован</option>
                            <option value="check_in">Регистрация</option>
                            <option value="boarding">Посадка</option>
                            <option value="last_call">LAST CALL</option>
                            <option value="completed">Посадка завершена</option>
                            <option value="departed">Вылетел</option>
                            <option value="cancelled">Отменен</option>
                          </select>
                          
                          <button 
                            onClick={() => delayFlight(flight)}
                            className="delay-btn"
                          >
                            {flight.is_delayed ? 'Изменить время' : 'Задержать'}
                          </button>

                          <button 
                            onClick={() => updateFlightGate(flight)}
                            className="gate-btn"
                            title="Изменить гейт"
                          >
                            🚪 Гейт
                          </button>

                          <button 
                            onClick={() => updateFlightDesks(flight)}
                            className="desks-btn"
                            title="Изменить стойки"
                          >
                            🛃 Стойки
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Новая вкладка для создания рейса */}
        {activeTab === 'create-flight' && (
          <section className="tab-section">
            <div className="section-header">
              <h3>Создание рейса</h3>
            </div>
            
            <form onSubmit={handleCreateFlight} className="flight-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="flight-number" className="form-label">Номер рейса</label>
                  <input 
                    id="flight-number"
                    type="text" 
                    value={flightData.flight_number}
                    onChange={(e) => setFlightData({...flightData, flight_number: e.target.value})}
                    placeholder="SU 100"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="arrival-airport" className="form-label">Аэропорт прибытия</label>
                  <input
                    type="text"
                    id="arrival-airport"
                    placeholder="Введите код аэропорта или город..."
                    value={flightData.arrival_airport}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFlightData({...flightData, arrival_airport: value});
                      
                      if (value.length >= 2) {
                        searchAirports(value);
                      } else {
                        setAirports([]);
                      }
                    }}
                    className="form-input"
                    style={{marginBottom: '0px'}}
                    required
                  />
                  
                  {airports.length > 0 && (
                    <div className="airport-suggestions">
                      {airports.map(airport => (
                        <div 
                          key={airport.iata_code} 
                          className="airport-suggestion-item"
                          onClick={() => {
                            setFlightData({
                              ...flightData, 
                              arrival_airport: airport.iata_code
                            });
                            setAirports([]);
                          }}
                        >
                          <strong>{airport.iata_code}</strong> - {airport.city} ({airport.name})
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                    Введите 2+ символа для поиска аэропорта
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="gate" className="form-label">Гейт</label>
                  <select 
                    id="gate"
                    value={flightData.gate_id}
                    onChange={(e) => setFlightData({...flightData, gate_id: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Выберите гейт</option>
                    {gates.map(gate => (
                      <option key={gate.id} value={gate.id}>
                        {gate.gate_number} - {gate.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="departure-time" className="form-label">Время вылета</label>
                  <input 
                    id="departure-time"
                    type="datetime-local" 
                    value={flightData.departure_time}
                    onChange={(e) => setFlightData({...flightData, departure_time: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="aircraft-type" className="form-label">Тип самолета</label>
                  <select 
                    id="aircraft-type"
                    value={flightData.aircraft_type}
                    onChange={(e) => setFlightData({...flightData, aircraft_type: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Выберите тип самолета</option>
                    {aircraftTypes.map(aircraft => (
                      <option key={aircraft.model} value={aircraft.model}>
                        {aircraft.model} - {aircraft.full_name} ({aircraft.total_seats} мест)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Стойки регистрации</label>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                    {checkInDesks.map(desk => (
                      <label key={desk.id} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <input
                          type="checkbox"
                          value={desk.id}
                          checked={flightData.check_in_desk_ids?.includes(desk.id.toString()) || false}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFlightData(prev => ({
                              ...prev,
                              check_in_desk_ids: e.target.checked
                                ? [...prev.check_in_desk_ids, value]
                                : prev.check_in_desk_ids.filter(id => id !== value)
                            }));
                          }}
                        />
                        <span>{desk.desk_number} - {desk.description}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">Создать рейс</button>
                {/* <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setActiveTab('flights')}
                >
                  Отмена
                </button> */}
              </div>
            </form>
          </section>
        )}

        {/* Вкладка управления гейтами */}
        {activeTab === 'gates' && (
          <section className="tab-section">
            <div className="section-header">
              <h3>Добавить новый гейт</h3>
            </div>
            
            <form onSubmit={handleCreateGate} className="management-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="gate-number" className="form-label">Номер гейта</label>
                  <input 
                    id="gate-number"
                    type="text" 
                    value={gateData.gate_number}
                    onChange={(e) => setGateData({...gateData, gate_number: e.target.value})}
                    placeholder="D4"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="gate-description" className="form-label">Описание</label>
                  <input 
                    id="gate-description"
                    type="text" 
                    value={gateData.description}
                    onChange={(e) => setGateData({...gateData, description: e.target.value})}
                    placeholder="DOMASTIC"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-button">Добавить гейт</button>
              </div>
            </form>

            <div className="section-header">
              <h3>Список гейтов</h3>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Номер гейта</th>
                    <th>Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {gates.map(gate => (
                    <tr key={gate.id}>
                      <td>{gate.gate_number}</td>
                      <td>{gate.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Вкладка управления стойками */}
        {activeTab === 'desks' && (
          <section className="tab-section">
            <div className="section-header">
              <h3>Добавить новую стойку регистрации</h3>
            </div>
            
            <form onSubmit={handleCreateDesk} className="management-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="desk-number" className="form-label">Номер стойки</label>
                  <input 
                    id="desk-number"
                    type="text" 
                    value={deskData.desk_number}
                    onChange={(e) => setDeskData({...deskData, desk_number: e.target.value})}
                    placeholder="D1"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="desk-description" className="form-label">Описание</label>
                  <input 
                    id="desk-description"
                    type="text" 
                    value={deskData.description}
                    onChange={(e) => setDeskData({...deskData, description: e.target.value})}
                    placeholder="SKY_PRIORITY"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-button">Добавить стойку</button>
              </div>
            </form>

            <div className="section-header">
              <h3>Список стоек регистрации</h3>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Номер стойки</th>
                    <th>Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {checkInDesks.map(desk => (
                    <tr key={desk.id}>
                      <td>{desk.desk_number}</td>
                      <td>{desk.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;