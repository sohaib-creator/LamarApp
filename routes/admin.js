import express from 'express';
import {
  getUsers, getCustomers, importCustomers, getDrivers, createDriver, toggleUserStatus, getStats,
  getPaymentMethods, togglePaymentMethod,
  getDeliveryCities, addDeliveryCity, toggleDeliveryCity, deleteDeliveryCity,
  getSettings, updateSetting,
} from '../controllers/adminController.js';
import { getAllReviews, moderateReview } from '../controllers/reviewsController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

export const adminRouter = express.Router();

adminRouter.get('/users', authRequired, roleRequired('admin'), permissionRequired('users.view'), getUsers);
adminRouter.get('/customers', authRequired, roleRequired('admin'), permissionRequired('users.view'), getCustomers);
adminRouter.post('/customers/import', authRequired, roleRequired('admin'), permissionRequired('users.update'), importCustomers);
adminRouter.get('/drivers', authRequired, roleRequired('admin'), permissionRequired('drivers.view'), getDrivers);
adminRouter.post('/drivers', authRequired, roleRequired('admin'), permissionRequired('drivers.update'), createDriver);
adminRouter.put('/users/:id/status', authRequired, roleRequired('admin'), permissionRequired('users.update', 'drivers.update'), toggleUserStatus);
adminRouter.get('/stats', authRequired, roleRequired('admin'), permissionRequired('dashboard.view'), getStats);

/* Payment Methods */
adminRouter.get('/payment-methods', authRequired, roleRequired('admin'), permissionRequired('payments.view'), getPaymentMethods);
adminRouter.put('/payment-methods/:id/toggle', authRequired, roleRequired('admin'), permissionRequired('payments.view'), togglePaymentMethod);

/* Delivery Cities */
adminRouter.get('/delivery-cities', authRequired, roleRequired('admin'), permissionRequired('delivery.view'), getDeliveryCities);
adminRouter.post('/delivery-cities', authRequired, roleRequired('admin'), permissionRequired('delivery.update'), addDeliveryCity);
adminRouter.put('/delivery-cities/:id/toggle', authRequired, roleRequired('admin'), permissionRequired('delivery.update'), toggleDeliveryCity);
adminRouter.delete('/delivery-cities/:id', authRequired, roleRequired('admin'), permissionRequired('delivery.update'), deleteDeliveryCity);

/* Reviews */
adminRouter.get('/reviews', authRequired, roleRequired('admin'), permissionRequired('reviews.manage'), getAllReviews);
adminRouter.put('/reviews/:id/moderate', authRequired, roleRequired('admin'), permissionRequired('reviews.manage'), moderateReview);

/* Settings */
adminRouter.get('/settings', authRequired, roleRequired('admin'), permissionRequired('settings.view'), getSettings);
adminRouter.put('/settings', authRequired, roleRequired('admin'), permissionRequired('settings.update'), updateSetting);
