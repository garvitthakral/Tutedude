import { io } from "socket.io-client";

// const socketApi = io("http://localhost:3001", {
//   withCredentials: true,
// });
const socketApi = io("https://tutedude-cpib.onrender.com", {
  path: "/socket.io",
  transports: ["polling", "websocket"], // polling first helps debug
  withCredentials: true,
});

export default socketApi;
