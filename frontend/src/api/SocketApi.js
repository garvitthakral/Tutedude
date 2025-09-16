import { io } from 'socket.io-client';

// const socketApi = io("http://localhost:3001", {
//   withCredentials: true,
// });
const socketApi = io("https://tutedude-cpib.onrender.com", {
  withCredentials: true,
});

export default socketApi;