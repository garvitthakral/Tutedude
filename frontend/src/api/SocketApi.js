import { io } from 'socket.io-client';

const socketApi = io("http://localhost:3001", {
  withCredentials: true,
});

export default socketApi;