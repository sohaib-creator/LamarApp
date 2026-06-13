import express from 'express';
import {
  storiesList,
  storiesGetById,
  storiesCreate,
  storiesUpdate,
  storiesDelete,
} from '../controllers/storiesController.js';
import { authRequired } from '../middleware/authRequired.js';

export const storiesRouter = express.Router();

storiesRouter.get('/', storiesList);
storiesRouter.get('/:id', storiesGetById);
storiesRouter.post('/', authRequired, storiesCreate);
storiesRouter.put('/:id', authRequired, storiesUpdate);
storiesRouter.delete('/:id', authRequired, storiesDelete);
