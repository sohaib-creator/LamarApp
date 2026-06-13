import express from 'express';
import { authRegister, authLogin, authLogout, authProfile } from '../controllers/authController.js';
import { authRequired } from '../middleware/authRequired.js';

export const authRouter = express.Router();

authRouter.post('/register', authRegister);
authRouter.post('/login', authLogin);
authRouter.post('/logout', authLogout);
authRouter.get('/profile', authRequired, authProfile);
