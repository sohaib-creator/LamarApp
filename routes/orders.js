import express from 'express';
import { createOrder, getOrders, getOrder, updateOrderStatus, assignDriver } from '../controllers/ordersController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

export const ordersRouter = express.Router();

ordersRouter.post('/', authRequired, createOrder);
ordersRouter.get('/', authRequired, getOrders);
ordersRouter.get('/:id', authRequired, getOrder);
ordersRouter.put('/:id/status', authRequired, updateOrderStatus);
ordersRouter.put('/:id/assign', authRequired, roleRequired('admin'), permissionRequired('orders.assign'), assignDriver);
