import express from 'express';
import { getDiscountCodes, getDiscountCode, createDiscountCode, updateDiscountCode, deleteDiscountCode, validateDiscountCode } from '../controllers/discountCodesController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

export const discountCodesRouter = express.Router();

discountCodesRouter.get('/', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), getDiscountCodes);
discountCodesRouter.get('/:id', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), getDiscountCode);
discountCodesRouter.post('/', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), createDiscountCode);
discountCodesRouter.put('/:id', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), updateDiscountCode);
discountCodesRouter.delete('/:id', authRequired, roleRequired('admin'), permissionRequired('marketing.manage'), deleteDiscountCode);

/* Public endpoint */
discountCodesRouter.post('/validate', validateDiscountCode);
