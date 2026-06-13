import express from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productsController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

export const productsRouter = express.Router();

productsRouter.get('/', getProducts);
productsRouter.get('/:id', getProduct);
productsRouter.post('/', authRequired, roleRequired('admin'), permissionRequired('products.update'), createProduct);
productsRouter.put('/:id', authRequired, roleRequired('admin'), permissionRequired('products.update'), updateProduct);
productsRouter.delete('/:id', authRequired, roleRequired('admin'), permissionRequired('products.update'), deleteProduct);
