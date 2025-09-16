import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import mongoose from "mongoose";
import { connectToServer } from "./utils/Sockets.js";
import reportsRoutes from "./routes/reportsRoutes.js"


const PORT = process.env.PORT || 3002;
const URL = process.env.MONGODB_URL || null;

const app = express();
const httpServer = createServer(app);
const io = connectToServer(httpServer);
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://tutedude-frontend-nche.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use("/api/fetch-all-reports", reportsRoutes);

mongoose
  .connect(URL)
  .then(() => {
    console.log("Connected to Database");

    httpServer.listen(PORT, () => {
      console.log(`server is listening on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

app.get("/", (req, res) => {
  res.send("Backend is working");
});