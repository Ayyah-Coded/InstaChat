import express from "express";
import "dotenv/config";
import cors from "cors";

import { connectDB } from "./db/db.js";
import { clerkMiddleware } from '@clerk/express';
import { handleClerkWebhook } from "./webhooks/clerk.webhook.js";
import job from "./lib/cron.js";


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

async function start() {
  await connectDB();
  dbReady = true;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    if (process.env.NODE_ENV === "production") job.start();
  })
};

start();