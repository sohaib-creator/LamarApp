import express from 'express';
import {
  commentsListForStory,
  commentCreate,
  commentDelete,
} from '../controllers/commentsController.js';
import { authRequired } from '../middleware/authRequired.js';

export const commentsRouter = express.Router();

commentsRouter.get('/:storyId', commentsListForStory);
commentsRouter.post('/', authRequired, commentCreate);
commentsRouter.delete('/:id', authRequired, commentDelete);
