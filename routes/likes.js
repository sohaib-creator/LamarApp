import express from 'express';
import { likesToggle } from '../controllers/likesController.js';
import { authRequired } from '../middleware/authRequired.js';

export const likesRouter = express.Router();

likesRouter.post('/', authRequired, likesToggle);
