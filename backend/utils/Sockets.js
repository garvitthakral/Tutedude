import { Server } from "socket.io";
import formatDurationFromISOs from "../controllers/durationMeeting.js";
import simpleComputeScore from "../controllers/scoreCal.js";
import Candidate from "../models/Candidate.js";

let io;
const FRONTEND = "https://tutedude-frontend-nche.onrender.com";

const pretty = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

const connectToServer = (httpServer) => {
  io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: FRONTEND,  
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"]
});

  io.on("connect", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinRoom", (roomID, username) => {
      socket.join(roomID);
      console.log(`User ${socket.id}: ${username} joined room ${roomID}`);

      socket.to(roomID).emit("user-joined", { username, socketId: socket.id });
    });

    socket.on("leaveRoom", (roomID) => {
      socket.leave(roomID);
      console.log(`User ${socket.id} left room ${roomID}`);
    });

    socket.on("submit-report", async ({ newData }) => {
      const { name, start, end, events, duration, length, score } = newData;
      const time = formatDurationFromISOs(start, end);
      const finalScore = simpleComputeScore(events);

      const finalData = new Candidate({
        username: name,
        startTime: pretty(start),
        endTime: pretty(end),
        suspiciousEvents: events,
        interviewDuration: time,
        focusLostCount: events.length,
        finalScore: finalScore,
      });
      await finalData.save();
      console.log(finalData);
    });

    socket.on("Red-Alert", ({ interviewID, username, label }) => {
      console.log("enter in red", interviewID, username, label);
      socket.to(interviewID).emit("Received-Red-Alert", { label, username });
      console.log("check");
    });

    //video call sockets
    // socket.on("send-message-event", (messageData) => {
    //   io.to(messageData.roomId).emit("receive-message-event", messageData);
    // });

    socket.on("offer", ({ roomId, offer, to }) => {
      console.log("enter in offer");
      socket.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ roomId, answer, to }) => {
      console.log("enter in ans");
      socket.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ roomId, candidate, to }) => {
      console.log("enter in ice-candidate");
      socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("leave-call", ({ roomId }) => {
      console.log("enter in cll");
      socket.to(roomId).emit("user-left", { socketId: socket.id });
      socket.leave(roomId);
    });

    socket.on("disconnect", () => {
      // Handle cleanup when user disconnects
      socket.broadcast.emit("user-left", { socketId: socket.id });
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
