import multer from "multer";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";


const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25mb

const UPLOAD_DIR = fs.mkdtempSync(path.join(tmpdir(), "instachat-uploads-"));

try {
  if (process.platform !== "win32") {
    fs.chmodSync(UPLOAD_DIR, 0o700);
    const { mode } = fs.statSync(UPLOAD_DIR);
    if ((mode & 0o777) !== 0o700) {
      throw new Error(
        `Upload directory "${UPLOAD_DIR}" has permissions ${(mode & 0o777).toString(8)}, expected 700`
      );
    };
  };
} catch (err) {
  console.error(
    `Upload directory permission enforcement failed: ${err.message}`
  );
  process.exit(1);
};

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      cb(new Error("Only image and video uploads are allowed"));
      return;
    }

    cb(null, true);
  },
});


const FILE_SIGNATURES = {
  "image/jpeg": { offset: 0, bytes: [0xFF, 0xD8, 0xFF] },
  "image/png": { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47] },
  "image/gif": { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },        // GIF87a / GIF89a
  "image/webp": {
    offset: 0, bytes: [0x52, 0x49, 0x46, 0x46],
    extra: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }
  }, // RIFF … WEBP
  "image/bmp": { offset: 0, bytes: [0x42, 0x4D] },                    // BM
  "video/mp4": { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },       // ....ftyp
  "video/webm": { offset: 0, bytes: [0x1A, 0x45, 0xDF, 0xA3] },       // EBML header
  "video/x-msvideo": {
    offset: 0, bytes: [0x52, 0x49, 0x46, 0x46],
    extra: { offset: 8, bytes: [0x41, 0x56, 0x49, 0x20] }
  }, // RIFF … AVI␣
};


function detectMimeType(header) {
  for (const [mime, sig] of Object.entries(FILE_SIGNATURES)) {
    const primaryOffset = sig.offset;
    const primaryMatch = sig.bytes.every((b, i) => header[primaryOffset + i] === b);
    if (!primaryMatch) continue;

    if (sig.extra) {
      const extraMatch = sig.extra.bytes.every((b, i) => header[sig.extra.offset + i] === b);
      if (!extraMatch) continue;
    }

    return mime;
  }
  return null;
}

export async function validateFileSignature(req, res, next) {
  if (!req.file) return next();

  const HEADER_BYTES = 16;
  const buf = Buffer.alloc(HEADER_BYTES);
  let fd;

  try {
    fd = await fs.promises.open(req.file.path, "r");
    await fd.read(buf, 0, HEADER_BYTES, 0);
  } catch (err) {
    console.error("Failed to read uploaded file:", err);

    // Close the descriptor first (Windows requires this before unlinking)
    if (fd) {
      try { await fd.close(); } catch { /* close errors are non-fatal */ }
      fd = undefined;
    }

    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== "ENOENT") {
        console.error("Failed to delete temp file after read error:", unlinkErr);
      }
    });

    return res.status(400).json({ message: "Could not read uploaded file" });
  } finally {
    if (fd) {
      try { await fd.close(); } catch { /* close errors are non-fatal */ }
    }
  }

  const detectedMime = detectMimeType(buf);

  if (!detectedMime) {
    // Clean up the temp file before responding
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== "ENOENT") {
        console.error("Failed to delete temp file:", unlinkErr);
      }
    });
    return res.status(400).json({
      message: "Unsupported or invalid file type. Only standard image and video formats are allowed.",
    });
  }

  // Override the client-supplied mimetype with the byte-verified one.
  req.file.mimetype = detectedMime;
  next();
}