import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  authRegister, authLogin, authLogout, authProfile,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword, changePassword, authGoogle,
} from '../controllers/authController.js';
import { authRequired } from '../middleware/authRequired.js';

export const authRouter = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again later.', data: [] },
  standardHeaders: 'draft-6',
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Try again later.', data: [] },
  standardHeaders: 'draft-6',
  legacyHeaders: false,
});

authRouter.post('/register', registerLimiter, authRegister);
authRouter.post('/login', loginLimiter, authLogin);
authRouter.post('/logout', authLogout);
authRouter.get('/profile', authRequired, authProfile);

authRouter.post('/verify-email', verifyEmail);
authRouter.post('/resend-verification', resendVerification);

authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/change-password', authRequired, changePassword);

authRouter.post('/google', authGoogle);
