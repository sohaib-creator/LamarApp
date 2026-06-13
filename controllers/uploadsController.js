import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function success(res, message = '', data = []) {
  res.json({ success: true, message, data });
}

function failure(res, message = 'Request failed', status = 400) {
  res.status(status).json({ success: false, message, data: [] });
}

// Local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed'), false);
    }
  },
});

// Upload locally and optionally to Cloudinary
export async function uploadFile(req, res) {
  try {
    if (!req.file) return failure(res, 'No file uploaded', 400);

    let imageUrl = `/uploads/${req.file.filename}`;

    // Upload to Cloudinary if configured
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      try {
        cloudinary.config({
          cloud_name: env.CLOUDINARY_CLOUD_NAME,
          api_key: env.CLOUDINARY_API_KEY,
          api_secret: env.CLOUDINARY_API_SECRET,
        });

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: env.CLOUDINARY_FOLDER || 'lamar' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          const readable = new Readable();
          readable.push(req.file.buffer);
          readable.push(null);
          readable.pipe(uploadStream);
        });

        imageUrl = result.secure_url;
      } catch {
        // fallback to local
      }
    }

    success(res, 'File uploaded', [{ url: imageUrl, filename: req.file.filename }]);
  } catch (err) {
    failure(res, err?.message || 'Upload failed', 500);
  }
}

// For multer errors
export function uploadErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return failure(res, err.message, 400);
  }
  if (err) {
    return failure(res, err.message, 400);
  }
  next();
}
