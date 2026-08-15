import "dotenv/config";
import cors from "cors";
import express from "express";
import job from "./lib/cron.js";
import { connectDB } from "./db/db.js";
import { clerkMiddleware } from '@clerk/express';

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { handleClerkWebhook } from "./webhooks/clerk.webhook.js";


const app = express();

app.use(cors({
  // origin: FRONTEND_URL,
  // credentials: true
}));
app.use(clerkMiddleware());

// Express route for Clerk Webhooks
app.post("/api/webhooks", express.raw({ type: "application/json" }), handleClerkWebhook);

app.use(express.json());

const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

let dbReady = false;

app.get("/health", (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ ok: false, message: "Database not ready" });
  }
  res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

async function start() {
  // Start listening immediately so /health is always reachable.
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Now connect to the database; /health will return 503 until this succeeds.
  try {
    await connectDB();
    dbReady = true;
  } catch (err) {
    console.error("Database connection failed:", err.message || err);
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") job.start();
}

start().catch((err) => {
  console.error("Failed to start the HTTP server:", err.message || err);
  process.exit(1);
});