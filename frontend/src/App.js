// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminPanel from './components/AdminPanel/AdminPanel';
import './App.css';
import OperatorPanel from './components/OperatorPanel/OperatorPanel';
import DeskOperator from './components/OperatorPanel/DeskOperator/DeskOperator';
import GateOperator from './components/OperatorPanel/GateOperator/GateOperator';
import DisplayPanel from './components/DisplayPanel/DisplayPanel';



axios.defaults.baseURL = '/api';

function App() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeView, setActiveView] = useState('main'); // 'main', 'desk', 'gate'

  // Для окон оператора
  const [deskNumber, setDeskNumber] = useState('');
  const [gateNumber, setGateNumber] = useState('');

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/auth/login', formData);
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setMessage('');
      setActiveView('main');
    } catch (error) {
      setMessage('Ошибка входа: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveView('main');
  };

  // Функции для открытия окон оператора
  const openDeskWindow = (deskNum) => {
    setDeskNumber(deskNum);
    setActiveView('desk');
  };

  const openGateWindow = (gateNum) => {
    setGateNumber(gateNum);
    setActiveView('gate');
  };

  const backToMain = () => {
    setActiveView('main');
  };

  // Компонент шапки
  const Header = ({ showBackButton = false }) => (
    <header className="app-header">
      <div className="header-content">
        <h1>MOW</h1>
        <h2>Панель управления</h2>
        <div className="time-info">
          {currentTime.toLocaleDateString('ru-RU')} {currentTime.toLocaleTimeString('ru-RU')}
        </div>
        <div className="user-info">
          <span>Пользователь: {user.username} ({user.role})</span>
          {showBackButton && (
            <button onClick={backToMain} className="back-button">
              ← Назад
            </button>
          )}
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </div>
    </header>
  );

  // Если пользователь авторизован
  if (user) {
    // Окно стойки регистрации
    if (activeView === 'desk') {
      return (
        <div className="App">
          <Header showBackButton={true} />
          <DeskOperator 
            deskNumber={deskNumber} 
            onBack={backToMain}
          />
        </div>
      );
    }

    // Окно гейта
    if (activeView === 'gate') {
      return (
        <div className="App">
          <Header showBackButton={true} />
          <GateOperator 
            gateNumber={gateNumber} 
            onBack={backToMain}
          />
        </div>
      );
    }

    // Главная панель
    return (
      <div className="App">
        <Header />
        
        {/* Показываем соответствующую панель по роли */}
        {user.role === 'admin' && <AdminPanel />}
        
        {user.role === 'operator' && (
          <OperatorPanel 
            onOpenDesk={openDeskWindow}
            onOpenGate={openGateWindow}
          />
        )}



        {user.role === 'display' && <DisplayPanel />}



      </div>
    );
  }

  // Страница входа
  return (
    <div className="App">
      <h1>MOW - Вход в систему</h1>
      <div className="time-info">
        {currentTime.toLocaleDateString('ru-RU')} {currentTime.toLocaleTimeString('ru-RU')}
      </div>
      
      <form onSubmit={handleLogin} className="login-form">
        <div>
          <label>Логин:</label>
          <input 
            type="text" 
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            placeholder="Введите логин:"
          />
        </div>
        
        <div>
          <label>Пароль:</label>
          <input 
            type="password" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Введите пароль:"
          />
        </div>

        <button type="submit">Войти</button>
      </form>

      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default App;