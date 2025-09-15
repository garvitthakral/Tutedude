import { Server } from "socket.io";
import formatDurationFromISOs from "../controllers/durationMeeting.js";
import simpleComputeScore from "../controllers/scoreCal.js";
import Candidate from "../models/Candidate.js";

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

    socket.on("submit-report", async ({ newData }) => {
      const { name, start, end, events, duration, length, score } = newData;
      const time = formatDurationFromISOs(start, end);
      const finalScore = simpleComputeScore(events);

      const finalData = new Candidate({
        username: name,
        startTime: start,
        endTime: end,
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
  });
  return io;
};

export { connectToServer };

// If i need to access the io instance
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized yet");
  return io;
};
