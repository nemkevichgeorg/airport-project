// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://80.93.61.209:5000/api',
});

// Добавляем токен к каждому запросу
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const managementAPI = {
  // Гейты
  getGates: () => API.get('/management/gates'),
  createGate: (data) => API.post('/management/gates', data),
  
  // Стойки регистрации
  getCheckInDesks: () => API.get('/management/check-in-desks'),
  createCheckInDesk: (data) => API.post('/management/check-in-desks', data),
};

export const adminAPI = {
  getFlights: () => API.get('/admin/flights'),
  createFlight: (data) => API.post('/admin/flights', data),
  searchAirports: (query) => API.get(`/admin/airports?search=${query}`),
  getAircraftTypes: () => API.get('/admin/aircraft-types'),
  updateFlightStatus: (flightId, data) => API.patch(`/admin/flights/${flightId}/status`, data),
  toggleFlightDelay: (flightId, data) => API.patch(`/admin/flights/${flightId}/delay`, data),
  delayFlight: (flightId, data) => API.patch(`/admin/flights/${flightId}/delay`, data),
  uploadPassengers: (flightId, formData) => API.post(`/admin/flights/${flightId}/passengers`, formData, {headers: { 'Content-Type': 'multipart/form-data' }}),
  getPassengerStats: (flightId) => API.get(`/admin/flights/${flightId}/passengers/stats`),
  updateFlightGate: (flightId, data) => API.patch(`/admin/flights/${flightId}/gate`, data),
  updateFlightDesks: (flightId, data) => API.patch(`/admin/flights/${flightId}/desks`, data),
};

// Operator API - ИСПРАВЛЕННЫЕ ПУТИ
export const operatorAPI = {
  getCheckInDesks: () => API.get('/operator/checkin-desks'),
  getGates: () => API.get('/operator/gates'),
  getActiveFlights: () => API.get('/operator/active-flights'),
  getDeskPassengers: (deskNumber) => 
    API.get(`/operator/desk/${deskNumber}/passengers`),
  getGatePassengers: (gateNumber) => 
    API.get(`/operator/gate/${gateNumber}/passengers`),
  checkInPassenger: (passengerId) => 
    API.post(`/operator/passengers/${passengerId}/checkin`),
  generateBoardingPass: (passengerId) => 
    API.post(`/operator/passengers/${passengerId}/boarding-pass`),
  boardPassenger: (passengerId) => 
    API.post(`/operator/passengers/${passengerId}/board`),
    assignSeat: (passengerId, seatNumber) => 
    API.patch(`/operator/passengers/${passengerId}/seat`, { seat_number: seatNumber }),
  addBaggage: (passengerId, weight) => 
    API.patch(`/operator/passengers/${passengerId}/baggage`, { weight }),
  getOccupiedSeats: (flightNumber) => 
    API.get(`/operator/flights/${flightNumber}/occupied-seats`),
  addLuggage: (luggageData) => API.post('/operator/luggage', luggageData),
  getPassengerLuggage: (passengerId) => API.get(`/operator/passengers/${passengerId}/luggage`),
  updatePassengerBaggageFlag: (passengerId, hasBaggage) => 
  API.patch(`/operator/passengers/${passengerId}/baggage-flag`, { has_baggage: hasBaggage }),
  scanBoardingPass: (boardingPassNumber) => 
    API.post('/operator/scan-boarding-pass', { 
      boarding_pass_number: boardingPassNumber 
    }),

};

export default API;