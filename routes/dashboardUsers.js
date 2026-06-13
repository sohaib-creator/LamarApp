import express from 'express';
import {
  getDashboardUsers, createDashboardUser, updateDashboardUser, deleteDashboardUser,
} from '../controllers/dashboardUsersController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

export const dashboardUsersRouter = express.Router();

dashboardUsersRouter.get('/', authRequired, roleRequired('admin'), permissionRequired('admin.users'), getDashboardUsers);
dashboardUsersRouter.post('/', authRequired, roleRequired('admin'), permissionRequired('admin.users'), createDashboardUser);
dashboardUsersRouter.put('/:id', authRequired, roleRequired('admin'), permissionRequired('admin.users'), updateDashboardUser);
dashboardUsersRouter.delete('/:id', authRequired, roleRequired('admin'), permissionRequired('admin.users'), deleteDashboardUser);
