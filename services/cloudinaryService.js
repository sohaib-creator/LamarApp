import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function uploadToCloudinary({ buffer, filename, folder }) {
  return cloudinary.uploader.upload_stream(
    {
      resource_type: 'image',
      folder: folder || env.CLOUDINARY_FOLDER,
      public_id: filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) : undefined,
      overwrite: false,
    },
    (err, result) => {
      if (err) return Promise.reject(err);
      return Promise.resolve(result);
    }
  );
}

// Promise wrapper for upload_stream
export function uploadImageFromBuffer({ buffer, filename, folder, contentType }) {
  const stream = cloudinary.uploader.upload_stream(
    {
      resource_type: 'image',
      folder: folder || env.CLOUDINARY_FOLDER,
      public_id: filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) : undefined,
      overwrite: false,
    },
    (err, result) => {
      if (err) throw err;
      return result;
    }
  );

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', () => {});
    stream.end(buffer);
    // Cloudinary returns via callback; use a wrapped callback approach
  });
}

// Correct promise wrapper using callback
export function uploadImage({ buffer, filename, folder }) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder || env.CLOUDINARY_FOLDER,
        public_id: filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) : undefined,
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    ).end(buffer);
  });
}
