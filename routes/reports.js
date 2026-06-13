import express from 'express';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';
import {
  salesByCategory, salesByProduct, salesByDriver,
  topCustomers, driverOfTheMonth, customerOfTheMonth, salesOverview,
} from '../controllers/reportsController.js';

export const reportsRouter = express.Router();

reportsRouter.use(authRequired, roleRequired('admin'), permissionRequired('reports.view'));

reportsRouter.get('/sales-by-category', salesByCategory);
reportsRouter.get('/sales-by-product', salesByProduct);
reportsRouter.get('/sales-by-driver', salesByDriver);
reportsRouter.get('/top-customers', topCustomers);
reportsRouter.get('/driver-of-month', driverOfTheMonth);
reportsRouter.get('/customer-of-month', customerOfTheMonth);
reportsRouter.get('/sales-overview', salesOverview);
