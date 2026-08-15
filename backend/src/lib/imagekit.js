import ImageKit from "@imagekit/nodejs";
import fs from "fs";

const imagekit = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });


function hasImageKitConfig() {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
};

function createFileName(originalName = "upload") {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `chat-${Date.now()}-${safeName}`;
};

async function uploadChatMedia(file) {
  const fileName = createFileName(file.originalname);

  // Stream the file from disk instead of loading its buffer into memory.
  // This keeps large media files (up to 25 MB) out of the application heap.
  const readStream = fs.createReadStream(file.path);

  try {
    const result = await imagekit.files.upload({
      file: readStream,
      fileName,
      folder: "/chat",
    });

    return result.url;
  } finally {
    // Clean up the temporary file regardless of success or failure.
    fs.unlink(file.path, (err) => {
      if (err) console.error("Failed to clean up temp file:", file.path, err.message);
    });
  }
};

export { uploadChatMedia, hasImageKitConfig };