import express from 'express';
import { getAddresses, getAddress, createAddress, updateAddress, deleteAddress } from '../controllers/addressesController.js';
import { authRequired } from '../middleware/authRequired.js';

export const addressesRouter = express.Router();

addressesRouter.get('/', authRequired, getAddresses);
addressesRouter.get('/:id', authRequired, getAddress);
addressesRouter.post('/', authRequired, createAddress);
addressesRouter.put('/:id', authRequired, updateAddress);
addressesRouter.delete('/:id', authRequired, deleteAddress);
