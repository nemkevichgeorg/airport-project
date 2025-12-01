// frontend/src/components/DeskOperator.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { operatorAPI } from '../../../services/api';
import './DeskOperator.css';
import BaggageTag from './BaggageTag/BaggageTag';
import BoardingPass from './BoardingPass/BoardingPass';


const DeskOperator = ({ deskNumber, onBack }) => {
  // Состояния для данных
  const [passengers, setPassengers] = useState([]);
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  
  // Состояния для поиска и выбора
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Состояния для мест
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [assignedSeats, setAssignedSeats] = useState({});
  
  // Состояния для диалогов
  const [showPassengerSelectDialog, setShowPassengerSelectDialog] = useState(false);
  const [seatForAssignment, setSeatForAssignment] = useState(null);
  
  // Состояния для багажа
  const [passengerLuggage, setPassengerLuggage] = useState({});
  const [showLuggageDialog, setShowLuggageDialog] = useState(false);
  const [selectedPassengerForLuggage, setSelectedPassengerForLuggage] = useState(null);
  const [newLuggageWeight, setNewLuggageWeight] = useState('');
  
  // Состояния для печати
  const [showBaggageTag, setShowBaggageTag] = useState(false);
  const [selectedLuggageForPrint, setSelectedLuggageForPrint] = useState(null);
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [boardingPassesToPrint, setBoardingPassesToPrint] = useState([]);
  const [currentBoardingPassIndex, setCurrentBoardingPassIndex] = useState(0);
  
  const dropdownRef = useRef(null);

  // Вспомогательные функции
  const getSelectedPassengersInfo = () => {
    return passengers.filter(p => selectedPassengers.includes(p.id));
  };

  const getPassengerBySeat = (seatNumber) => {
    const passengerId = assignedSeats[seatNumber];
    return passengers.find(p => p.id === passengerId);
  };

  const isSeatOccupied = (seatNumber) => {
    return occupiedSeats.includes(seatNumber);
  };

  // API функции
  const loadFlightsAndPassengers = useCallback(async () => {
    try {
      const response = await operatorAPI.getDeskPassengers(deskNumber);
      const passengersData = response.data;
      
      const flightsMap = {};
      passengersData.forEach(passenger => {
        if (!flightsMap[passenger.flight_number]) {
          flightsMap[passenger.flight_number] = {
            flight_number: passenger.flight_number,
            arrival_airport: passenger.arrival_airport,
            departure_time: passenger.departure_time,
            gate_number: passenger.gate_number,
            passengers: []
          };
        }
        flightsMap[passenger.flight_number].passengers.push(passenger);
      });
      
      const flightsList = Object.values(flightsMap);
      setFlights(flightsList);
      setPassengers(passengersData);
      
      if (flightsList.length > 0 && !selectedFlight) {
        setSelectedFlight(flightsList[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  }, [deskNumber, selectedFlight]);

  const loadOccupiedSeats = useCallback(async (flightNumber) => {
    try {
      const response = await operatorAPI.getOccupiedSeats(flightNumber);
      setOccupiedSeats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки занятых мест:', error);
      setOccupiedSeats([]);
    }
  }, []);

const loadPassengerLuggage = async (passengerId) => {
  try {
    console.log('🛄 Loading luggage for passenger ID:', passengerId);
    
    const response = await operatorAPI.getPassengerLuggage(passengerId);
    console.log('🛄 Luggage response:', response.data);
    
    setPassengerLuggage(prev => ({
      ...prev,
      [passengerId]: response.data || []
    }));
    
  } catch (error) {
    console.error('❌ Ошибка загрузки багажа:', error);
    console.error('❌ Error details:', error.response?.data);
    
    setPassengerLuggage(prev => ({
      ...prev,
      [passengerId]: []
    }));
  }
};



  // Обработчики событий
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  const handlePassengerSelect = (passengerId) => {
    setSelectedPassengers(prev => {
      if (prev.includes(passengerId)) {
        return prev.filter(id => id !== passengerId);
      } else {
        return [...prev, passengerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPassengers.length === filteredPassengers.length) {
      setSelectedPassengers([]);
    } else {
      setSelectedPassengers(filteredPassengers.map(p => p.id));
    }
  };

  const handleSeatClick = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) {
      alert(`Место ${seatNumber} уже занято!`);
      return;
    }

    if (selectedPassengers.length === 0) {
      alert('Сначала выберите пассажиров из списка');
      return;
    }
    
    setSeatForAssignment(seatNumber);
    setShowPassengerSelectDialog(true);
  };

const handlePassengerAssign = async (passengerId) => {
  if (!seatForAssignment) return;

  if (occupiedSeats.includes(seatForAssignment)) {
    alert(`Место ${seatForAssignment} уже занято!`);
    setShowPassengerSelectDialog(false);
    setSeatForAssignment(null);
    return;
  }

  setAssignedSeats(prev => ({
    ...prev,
    [seatForAssignment]: passengerId
  }));

  setSelectedSeat(seatForAssignment);
  setShowPassengerSelectDialog(false);
  setSeatForAssignment(null);
  
  // Загружаем багаж перед открытием диалога
  await loadPassengerLuggage(passengerId);
  
  setSelectedPassengerForLuggage(passengerId);
  setShowLuggageDialog(true);
};

const handleAddLuggage = async () => {
  if (!selectedPassengerForLuggage || !newLuggageWeight) {
    alert('Введите вес багажа');
    return;
  }

  const passenger = passengers.find(p => p.id === selectedPassengerForLuggage);
  if (!passenger) return;

  const flightDate = new Date().toISOString().split('T')[0];

  try {
    console.log('🛄 Adding luggage with passenger_id:', selectedPassengerForLuggage);
    
    const luggageData = {
      flight_number: passenger.flight_number,
      date: flightDate,
      arrival_airport: passenger.arrival_airport,
      first_name: passenger.first_name,
      last_name: passenger.last_name,
      weight: parseFloat(newLuggageWeight),
      passenger_id: selectedPassengerForLuggage  // ✅ Теперь передаем passenger_id
    };

    const response = await operatorAPI.addLuggage(luggageData);
    console.log('🛄 Add luggage response:', response.data);

    // Обновляем флаг багажа
    await operatorAPI.updatePassengerBaggageFlag(selectedPassengerForLuggage, true);
    
    // Обновляем состояние пассажира
    setPassengers(prev => prev.map(p => 
      p.id === selectedPassengerForLuggage 
        ? { ...p, has_baggage: true }
        : p
    ));

    if (selectedFlight) {
      setSelectedFlight(prev => ({
        ...prev,
        passengers: prev.passengers.map(p => 
          p.id === selectedPassengerForLuggage 
            ? { ...p, has_baggage: true }
            : p
        )
      }));
    }

    // Перезагружаем багаж
    setTimeout(() => {
      loadPassengerLuggage(selectedPassengerForLuggage);
    }, 500);

    setNewLuggageWeight('');
    alert('Багаж добавлен!');
    
  } catch (error) {
    console.error('❌ Ошибка добавления багажа:', error);
    alert('Ошибка при добавлении багажа: ' + (error.response?.data?.error || error.message));
  }
};

  const handleFinishLuggage = () => {
    setShowLuggageDialog(false);
    setSelectedPassengerForLuggage(null);
    setNewLuggageWeight('');
  };

  const handlePrintBaggageTag = (luggage) => {
    setSelectedLuggageForPrint(luggage);
    setShowBaggageTag(true);
  };

  const handleCloseBaggageTag = () => {
    setShowBaggageTag(false);
    setSelectedLuggageForPrint(null);
  };

  const handleCheckIn = async () => {
    if (selectedPassengers.length === 0 || !selectedSeat) {
      alert('Выберите пассажиров и место!');
      return;
    }

    for (const passengerId of selectedPassengers) {
      const assignedSeat = Object.entries(assignedSeats).find(([seat, id]) => id === passengerId);
      const seatToCheck = assignedSeat ? assignedSeat[0] : selectedSeat;
      
      if (occupiedSeats.includes(seatToCheck)) {
        alert(`Место ${seatToCheck} уже занято! Выберите другое место.`);
        return;
      }
    }

    try {
      const checkedInPassengers = [];
      
      for (const passengerId of selectedPassengers) {
        await operatorAPI.checkInPassenger(passengerId);
        const boardingPassResponse = await operatorAPI.generateBoardingPass(passengerId);
        
        const assignedSeat = Object.entries(assignedSeats).find(([seat, id]) => id === passengerId);
        if (assignedSeat) {
          await operatorAPI.assignSeat(passengerId, assignedSeat[0]);
        } else {
          await operatorAPI.assignSeat(passengerId, selectedSeat);
        }
        
        const passenger = passengers.find(p => p.id === passengerId);
        if (passenger) {
          checkedInPassengers.push({
            ...passenger,
            seat_number: assignedSeat ? assignedSeat[0] : selectedSeat,
            boarding_pass_number: boardingPassResponse.data.passenger?.boarding_pass_number
          });
        }
      }
      
      if (checkedInPassengers.length > 0) {
        console.log('Boarding passes to print:', checkedInPassengers.length);
        setBoardingPassesToPrint(checkedInPassengers);
        setCurrentBoardingPassIndex(0);
        setShowBoardingPass(true);
      }
      
      alert('Регистрация завершена!');
      
      setSelectedPassengers([]);
      setSelectedSeat(null);
      setSearchQuery('');
      setShowDropdown(false);
      setAssignedSeats({});
      setPassengerLuggage({});
      
      if (selectedFlight) {
        loadOccupiedSeats(selectedFlight.flight_number);
      }
      loadFlightsAndPassengers();
      
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      alert('Ошибка при регистрации');
    }
  };

  const handleNextBoardingPass = () => {
    if (currentBoardingPassIndex < boardingPassesToPrint.length - 1) {
      setCurrentBoardingPassIndex(prev => prev + 1);
    }
  };

  const handlePreviousBoardingPass = () => {
    if (currentBoardingPassIndex > 0) {
      setCurrentBoardingPassIndex(prev => prev - 1);
    }
  };

  const handleCloseBoardingPass = () => {
    setShowBoardingPass(false);
    setBoardingPassesToPrint([]);
    setCurrentBoardingPassIndex(0);
  };

  // Эффекты
  useEffect(() => {
    loadFlightsAndPassengers();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [loadFlightsAndPassengers]);

  useEffect(() => {
    if (selectedFlight) {
      loadOccupiedSeats(selectedFlight.flight_number);
    }
  }, [selectedFlight, loadOccupiedSeats]);


  // Добавь этот эффект после других useEffect
useEffect(() => {
  if (showLuggageDialog && selectedPassengerForLuggage) {
    // Автоматически загружаем багаж при открытии диалога
    loadPassengerLuggage(selectedPassengerForLuggage);
  }
}, [showLuggageDialog, selectedPassengerForLuggage]);

  // Фильтрация
  const filteredPassengers = selectedFlight ? selectedFlight.passengers.filter(passenger => {
    const query = searchQuery.toLowerCase();
    const fullName = passenger.full_name?.toLowerCase() || '';
    const documentNumber = passenger.document_number?.toLowerCase() || '';
    const firstName = passenger.first_name?.toLowerCase() || '';
    const lastName = passenger.last_name?.toLowerCase() || '';
    const classType = passenger.class_type?.toLowerCase() || '';
    
    return fullName.includes(query) ||
           documentNumber.includes(query) ||
           firstName.includes(query) ||
           lastName.includes(query) ||
           classType.includes(query);
  }) : [];

  // Вложенные компоненты
  const LuggageDialog = () => {
    if (!showLuggageDialog || !selectedPassengerForLuggage) return null;

    const passenger = passengers.find(p => p.id === selectedPassengerForLuggage);
    const luggage = passengerLuggage[selectedPassengerForLuggage] || [];

  console.log('LuggageDialog - passenger:', passenger);
  console.log('LuggageDialog - luggage:', luggage);

    return (
      <div className="dialog-overlay">
        <div className="luggage-dialog">
          <h3>Добавление багажа для {passenger?.full_name}</h3>

                  {/* Отладочная информация */}
        <div style={{background: '#e3f2fd', padding: '10px', marginBottom: '15px', borderRadius: '5px'}}>
          <p><strong>Отладка:</strong> Passenger ID: {selectedPassengerForLuggage}</p>
          <p><strong>Найдено багажа:</strong> {luggage.length} шт.</p>
          <button 
            onClick={() => loadPassengerLuggage(selectedPassengerForLuggage)}
            className="btn btn-info btn-sm"
          >
            🔄 Перезагрузить багаж
          </button>
        </div>
          
          <div className="current-luggage">
            
            <h4>Текущий багаж:</h4>
            {luggage.length === 0 ? (
              <p>Багаж не добавлен</p>
            ) : (
              <div className="luggage-list">
                {luggage.map(item => (
                  <div key={item.tag_id} className="luggage-item">
                    <div className="luggage-info">
                      <span className="tag-id">Бирка: {item.tag_id}</span>
                      <span className="weight">Вес: {item.weight} кг</span>
                    </div>
                    <button 
                      onClick={() => handlePrintBaggageTag(item)}
                      className="btn btn-print"
                      title="Печать бирки"
                    >
                      🖨️ Печать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="add-luggage-form">
            <h4>Добавить новый чемодан:</h4>
            <div className="luggage-input">
              <label>Вес чемодана (кг):</label>
              <input
                type="number"
                step="0.1"
                value={newLuggageWeight}
                onChange={(e) => setNewLuggageWeight(e.target.value)}
                placeholder="Введите вес"
              />
            </div>
            <div className="luggage-actions">
              <button 
                onClick={handleAddLuggage}
                className="btn btn-primary"
                disabled={!newLuggageWeight}
              >
                Добавить чемодан
              </button>
              <button 
                onClick={handleFinishLuggage}
                className="btn btn-success"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PassengerSelectDialog = () => {
    if (!showPassengerSelectDialog || !seatForAssignment) return null;

    const selectedPassengersInfo = getSelectedPassengersInfo();

    return (
      <div className="dialog-overlay">
        <div className="passenger-select-dialog">
          <h3>Выберите пассажира для места {seatForAssignment}</h3>
          {isSeatOccupied(seatForAssignment) ? (
            <div className="seat-occupied-warning">
              ⚠️ Место {seatForAssignment} уже занято!
            </div>
          ) : (
            <div className="passenger-list-dialog">
              {selectedPassengersInfo.map(passenger => (
                <button
                  key={passenger.id}
                  className="passenger-select-btn"
                  onClick={() => handlePassengerAssign(passenger.id)}
                >
                  <span className="document-number">{passenger.document_number || 'N/A'}</span>
                  <span className="name">{passenger.full_name || 'Неизвестный пассажир'}</span>
                  <span className="class-type">{passenger.class_type}</span>
                  {assignedSeats[seatForAssignment] === passenger.id && (
                    <span className="assigned-badge">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="dialog-actions">
            <button 
              onClick={() => setShowPassengerSelectDialog(false)}
              className="btn btn-secondary"
            >
              Отмена
            </button>
            {!isSeatOccupied(seatForAssignment) && (
              <button 
                onClick={() => {
                  setAssignedSeats(prev => {
                    const newSeats = { ...prev };
                    delete newSeats[seatForAssignment];
                    return newSeats;
                  });
                  setShowPassengerSelectDialog(false);
                }}
                className="btn btn-warning"
              >
                Очистить место
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SeatMap = ({ aircraftType = 'Boeing 737' }) => {
    const businessSeats = [
      ['1A', '1B', '', '1C', '1D'],
      ['2A', '2B', '', '2C', '2D'],
      ['3A', '3B', '', '3C', '3D']
    ];
    
    const economySeats = [
      ['4A', '4B', '4C', '', '4D', '4E', '4F'],
      ['5A', '5B', '5C', '', '5D', '5E', '5F'],
      ['6A', '6B', '6C', '', '6D', '6E', '6F'],
      ['7A', '7B', '7C', '', '7D', '7E', '7F'],
      ['8A', '8B', '8C', '', '8D', '8E', '8F'],
      ['9A', '9B', '9C', '', '9D', '9E', '9F'],
      ['10A', '10B', '10C', '', '10D', '10E', '10F'],
      ['11A', '11B', '11C', '', '11D', '11E', '11F'],
      ['12A', '12B', '12C', '', '12D', '12E', '12F'],
      ['13A', '13B', '13C', '', '13D', '13E', '13F'],
      ['14A', '14B', '14C', '', '14D', '14E', '14F'],
      ['15A', '15B', '15C', '', '15D', '15E', '15F']
    ];

    const renderSeat = (seat) => {
      const assignedPassenger = getPassengerBySeat(seat);
      const isSelected = selectedSeat === seat;
      const isOccupied = isSeatOccupied(seat);

      return (
        <button
          key={seat}
          className={`seat ${isSelected ? 'selected' : ''} ${assignedPassenger ? 'assigned' : ''} ${isOccupied ? 'occupied' : ''}`}
          onClick={() => !isOccupied && handleSeatClick(seat)}
          title={isOccupied ? `Место ${seat} занято` : assignedPassenger ? `Место занято: ${assignedPassenger.full_name}` : 'Свободное место'}
          disabled={isOccupied}
        >
          {seat}
          {assignedPassenger && <div className="seat-assigned-indicator">✓</div>}
          {isOccupied && <div className="seat-occupied-indicator">✗</div>}
        </button>
      );
    };

    return (
      <div className="seat-map">
        <h3>Схема салона {aircraftType}</h3>
        
        <div className="seat-legend">
          <div className="legend-item">
            <div className="seat free"></div>
            <span>Свободно</span>
          </div>
          <div className="legend-item">
            <div className="seat assigned"></div>
            <span>Выбрано вами</span>
          </div>
          <div className="legend-item">
            <div className="seat selected"></div>
            <span>Активное</span>
          </div>
          <div className="legend-item">
            <div className="seat occupied"></div>
            <span>Занято</span>
          </div>
        </div>
        
        <div className="business-class">
          <h4>Класс бизнес</h4>
          {businessSeats.map((row, rowIndex) => (
            <div key={rowIndex} className="seat-row">
              {row.map((seat, seatIndex) => (
                seat ? (
                  renderSeat(seat)
                ) : (
                  <div key={`empty-${rowIndex}-${seatIndex}`} className="seat-empty"></div>
                )
              ))}
            </div>
          ))}
        </div>

        <div className="economy-class">
          <h4>Класс эконом</h4>
          {economySeats.map((row, rowIndex) => (
            <div key={rowIndex} className="seat-row">
              {row.map((seat, seatIndex) => (
                seat ? (
                  renderSeat(seat)
                ) : (
                  <div key={`empty-${rowIndex}-${seatIndex}`} className="seat-empty"></div>
                )
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Основной JSX
  return (
    <div className="desk-operator">
      <header className="desk-header">
        <div className="header-top">
          <h2>Стойка регистрации {deskNumber}</h2>
          <button onClick={onBack} className="back-button">← Назад к списку</button>
        </div>
      </header>

      <main className="desk-main">
        <section className="flight-selection">
          <h3>Рейсы:</h3>
          <div className="flight-radio-group">
            {flights.map(flight => (
              <label key={flight.flight_number} className="flight-radio">
                <input
                  type="radio"
                  name="flight"
                  value={flight.flight_number}
                  checked={selectedFlight?.flight_number === flight.flight_number}
                  onChange={() => {
                    setSelectedFlight(flight);
                    setSelectedPassengers([]);
                    setSearchQuery('');
                    setShowDropdown(false);
                    setAssignedSeats({});
                    setSelectedSeat(null);
                  }}
                />
                {flight.flight_number} → {flight.arrival_airport}
              </label>
            ))}
          </div>
        </section>

        {selectedFlight && (
          <>
            <section className="passenger-search" ref={dropdownRef}>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Введите ФИО, номер документа или класс пассажира"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
                  className="search-input"
                />
              </div>

              {showDropdown && filteredPassengers.length > 0 && (
                <div className="passenger-dropdown">
                  <div className="dropdown-header">
                    <span>Найдено: {filteredPassengers.length}</span>
                    <button 
                      onClick={handleSelectAll}
                      className="select-all-btn"
                    >
                      {selectedPassengers.length === filteredPassengers.length ? 'Снять все' : 'Выбрать все'}
                    </button>
                  </div>
                  
                  <div className="dropdown-list">
                    {filteredPassengers.map(passenger => (
                      <label key={passenger.id} className="passenger-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPassengers.includes(passenger.id)}
                          onChange={() => handlePassengerSelect(passenger.id)}
                        />
                        <span className="document-number">{passenger.document_number || 'N/A'}</span>
                        <span className="passenger-name">{passenger.full_name || 'Неизвестный пассажир'}</span>
                        <span className="class-type">{passenger.class_type}</span>
                        {passenger.has_baggage && <span className="baggage-indicator">🎒</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedPassengers.length > 0 && (
                <div className="selected-passengers">
                  <h4>Выбранные пассажиры:</h4>
                  {getSelectedPassengersInfo().map(passenger => (
                    <div key={passenger.id} className="selected-passenger-item">
                      <span className="document">{passenger.document_number || 'N/A'}</span>
                      <span className="name">{passenger.full_name || 'Неизвестный пассажир'}</span>
                      <span className="class">{passenger.class_type}</span>
                      {passenger.has_baggage && <span className="baggage-badge">🎒 Багаж</span>}
                      <span className="assigned-seat">
                        {Object.entries(assignedSeats).find(([seat, id]) => id === passenger.id)?.[0] || 'Место не выбрано'}
                      </span>
                      <button 
                        onClick={() => handlePassengerSelect(passenger.id)}
                        className="remove-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="registration-controls">
              <button 
                onClick={() => setShowSeatMap(!showSeatMap)}
                className="btn btn-primary"
              >
                {showSeatMap ? 'Скрыть схему салона' : 'Схема салона'}
              </button>

              {selectedSeat && (
                <div className="selected-seat">
                  Выбрано место: <strong>{selectedSeat}</strong>
                  {isSeatOccupied(selectedSeat) && (
                    <span className="occupied-warning"> ⚠️ Занято!</span>
                  )}
                </div>
              )}

              <button 
                onClick={handleCheckIn}
                className="btn btn-success"
                disabled={selectedPassengers.length === 0 || !selectedSeat || isSeatOccupied(selectedSeat)}
              >
                Зарегистрировать ({selectedPassengers.length}) пассажиров
              </button>
            </section>

            {showSeatMap && (
              <section className="seat-map-section">
                <SeatMap />
              </section>
            )}
          </>
        )}

        {/* Диалоги */}
        <LuggageDialog />
        <PassengerSelectDialog />
        
        {showBaggageTag && selectedLuggageForPrint && (
          <div className="dialog-overlay print-overlay">
            <BaggageTag 
              luggage={selectedLuggageForPrint}
              passenger={passengers.find(p => p.id === selectedPassengerForLuggage)}
              onClose={handleCloseBaggageTag}
            />
          </div>
        )}

        {showBoardingPass && boardingPassesToPrint.length > 0 && (
          <div className="dialog-overlay print-overlay">
            <BoardingPass 
              passenger={boardingPassesToPrint[currentBoardingPassIndex]}
              flight={selectedFlight}
              onClose={handleCloseBoardingPass}
              onNext={handleNextBoardingPass}
              onPrevious={handlePreviousBoardingPass}
              currentIndex={currentBoardingPassIndex}
              totalCount={boardingPassesToPrint.length}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default DeskOperator;