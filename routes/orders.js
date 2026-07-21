import express from 'express';
import rateLimit from 'express-rate-limit';
import { createOrder, getOrders, getOrder, updateOrderStatus, assignDriver } from '../controllers/ordersController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

const ordersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many orders, please try again later', data: [] },
});

export const ordersRouter = express.Router();

ordersRouter.post('/', authRequired, ordersLimiter, createOrder);
ordersRouter.get('/', authRequired, getOrders);
ordersRouter.get('/:id', authRequired, getOrder);
ordersRouter.put('/:id/status', authRequired, updateOrderStatus);
ordersRouter.put('/:id/assign', authRequired, roleRequired('admin'), permissionRequired('orders.assign'), assignDriver);
