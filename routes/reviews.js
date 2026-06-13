import express from 'express';
import {
  getProductReviews, createReview, updateReview, deleteReview,
  getProductRatingSummary, canRateProduct
} from '../controllers/reviewsController.js';
import { authRequired } from '../middleware/authRequired.js';
import { authOptional } from '../middleware/authOptional.js';

export const reviewsRouter = express.Router();

reviewsRouter.get('/products/:productId/reviews', getProductReviews);
reviewsRouter.get('/products/:productId/rating', getProductRatingSummary);
reviewsRouter.get('/products/:productId/can-rate', authOptional, canRateProduct);
reviewsRouter.post('/products/:productId/reviews', authRequired, createReview);
reviewsRouter.put('/reviews/:id', authRequired, updateReview);
reviewsRouter.delete('/reviews/:id', authRequired, deleteReview);
