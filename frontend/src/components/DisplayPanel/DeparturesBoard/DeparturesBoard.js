// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { API } from '../../services/api';

// function DeparturesBoard() {
//   const [flights, setFlights] = useState([]);

//   useEffect(() => {
//     API.get('/display/departures') // <-- здесь /api добавляется автоматически через baseURL
//       .then(res => setFlights(res.data))
//       .catch(err => console.error(err));
//   }, []);

//   return (
//     <div className="board">
//       <h2>Вылеты</h2>
//       <table>
//         <thead>
//           <tr>
//             <th>Рейс</th>
//             <th>Время</th>
//             <th>Гейт</th>
//             <th>Статус</th>
//           </tr>
//         </thead>
//         <tbody>
//           {flights.map(f => (
//             <tr key={f.flight_number}>
//               <td>{f.flight_number}</td>
//               <td>{new Date(f.departure_time).toLocaleTimeString()}</td>
//               <td>{f.gate_number || '—'}</td>
//               <td>{f.status}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default DeparturesBoard;
