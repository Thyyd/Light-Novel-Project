import { Router } from 'express';
import { decodeToken } from '../middlewares/decodeToken.js';
import { registerUser } from '../controllers/users.controller.js';

const router = Router();

router.post('/', decodeToken, registerUser);

export default router;