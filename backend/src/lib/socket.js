import http from "http";
import express from "express";
import { Server } from "socket.io";
import { clerkClient } from "@clerk/express";
import User from "../db/models/User.js";


const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL;

const io = new Server(server, { cors: { origin: [allowedOrigin] } });

const userSocketMap = {};

function getReceiverSocketId(userId) {
  return userSocketMap[userId];
};

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    const payload = await clerkClient.verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY,
    });

    socket.data.userId = payload.sub;

    next();
  } catch (error) {
    console.error("Socket handshake authentication failed:", error.message);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", async (socket) => {
  let user;
  try {
    user = await User.findOne({ clerkId: socket.data.userId });
  } catch (error) {
    console.error("Socket user resolution failed:", error.message);
    socket.disconnect(true);
    return;
  }

  if (!user) {
    socket.disconnect(true);
    return;
  }

  const userId = user._id.toString();
  userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userSocketMap[userId] === socket.id) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server, io, getReceiverSocketId };