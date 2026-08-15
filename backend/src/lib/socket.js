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

// Authenticate every socket handshake with a verified Clerk session token.
// The origin allowlist above only governs CORS; it does NOT authenticate the
// socket client, so we never trust client-supplied handshake data here.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    // Verify the Clerk session token and read the verified subject claim.
    // This is the only trusted source of the socket's identity.
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
  // Resolve the verified Clerk subject to this app's User so the socket can be
  // registered under the same Mongo _id used by message delivery. The client is
  // never allowed to pick its own socket identity.
  const user = await User.findOne({ clerkId: socket.data.userId });

  if (!user) {
    socket.disconnect(true);
    return;
  }

  const userId = user._id.toString();
  userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    // Only remove this socket's mapping if it is still the current one for the
    // user, so a stale socket can never clear a newer connection's entry.
    if (userSocketMap[userId] === socket.id) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server, io, getReceiverSocketId };