import { Webhook } from "svix";
import User from "../db/models/User.js";

export const handleClerkWebhook = async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return res.status(500).json({ error: "Missing CLERK_WEBHOOK_SECRET in env" });
  }

  // Get raw string payload directly from Buffer
  const payload = req.body.toString("utf8");

  // Extract Svix headers
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing Svix headers" });
  }

  // Verify signature
  const wh = new Webhook(SIGNING_SECRET);
  let evt;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const eventType = evt.type;
  const { id } = evt.data;

  // Handle user lifecycle events
  try {
    if (eventType === "user.created") {
      const { email_addresses, first_name, last_name, image_url } = evt.data;

      const primaryEmail = email_addresses?.[0]?.email_address;
      const fullName = `${first_name || ""} ${last_name || ""}`.trim() || "User";

      await User.create({
        clerkId: id,
        email: primaryEmail,
        fullName,
        profilePic: image_url || "",
      });
    }

    else if (eventType === "user.updated") {
      const { email_addresses, first_name, last_name, image_url } = evt.data;

      const primaryEmail = email_addresses?.[0]?.email_address;
      const fullName = `${first_name || ""} ${last_name || ""}`.trim() || "User";

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: primaryEmail,
          fullName,
          profilePic: image_url || "",
        }
      );
    }

    else if (eventType === "user.deleted") {
      await User.findOneAndDelete({ clerkId: id });
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Database operation failed:", error);
    return res.status(500).json({ error: "Database operation failed" });
  }
};