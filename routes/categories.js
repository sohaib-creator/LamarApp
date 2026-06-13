import express from 'express';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoriesController.js';
import { authRequired } from '../middleware/authRequired.js';
import { roleRequired } from '../middleware/roleRequired.js';
import { permissionRequired } from '../middleware/permissionRequired.js';

export const categoriesRouter = express.Router();

categoriesRouter.get('/', getCategories);
categoriesRouter.get('/:id', getCategory);
categoriesRouter.post('/', authRequired, roleRequired('admin'), permissionRequired('categories.update'), createCategory);
categoriesRouter.put('/:id', authRequired, roleRequired('admin'), permissionRequired('categories.update'), updateCategory);
categoriesRouter.delete('/:id', authRequired, roleRequired('admin'), permissionRequired('categories.update'), deleteCategory);
