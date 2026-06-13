import express from 'express';
import { getPromotions, getActivePromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotionsController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

export const promotionsRouter = express.Router();

promotionsRouter.get('/', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), getPromotions);
promotionsRouter.post('/', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), createPromotion);
promotionsRouter.put('/:id', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), updatePromotion);
promotionsRouter.delete('/:id', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), deletePromotion);

/* Public endpoint */
promotionsRouter.get('/active', getActivePromotions);
