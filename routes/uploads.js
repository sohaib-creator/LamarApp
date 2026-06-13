import express from 'express';
import { upload, uploadFile, uploadErrorHandler } from '../controllers/uploadsController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

export const uploadsRouter = express.Router();

uploadsRouter.post('/',
  authRequired,
  roleRequired('admin'),
  permissionRequired('products.update'),
  upload.single('file'),
  uploadErrorHandler,
  uploadFile
);
