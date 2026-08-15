import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload, validateFileSignature } from "../middleware/upload.middleware.js";

import {
  getConversationsForSidebar, getMessages, getUsersForSidebar, sendMessage
} from "../controllers/message.controller.js";


const router = express.Router();

router.use(protectRoute);

router.get("/users", getUsersForSidebar);
router.get("/conversations", getConversationsForSidebar);
router.get("/:id", getMessages);
router.post("/send/:id", upload.single("media"), validateFileSignature, sendMessage);

export default router;