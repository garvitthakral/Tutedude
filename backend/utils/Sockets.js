import { Server } from "socket.io";

let io;

const connectToServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connect", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinRoom", (roomID, username) => {
      socket.join(roomID);
      console.log(`User ${socket.id}: ${username} joined room ${roomID}`);
    });

    socket.on("leaveRoom", (roomID) => {
      socket.leave(roomID);
      console.log(`User ${socket.id} left room ${roomID}`);
    });
  });
  return io;
};

export { connectToServer };

// If i need to access the io instance
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized yet");
  return io;
};