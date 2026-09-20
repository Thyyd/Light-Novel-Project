import { Router } from 'express';
import { decodeToken } from '../middlewares/decodeToken.js';
import { registerUser, getEmailByPseudo } from '../controllers/users.controller.js';

const router = Router();

router.post('/', decodeToken, registerUser);

router.get('/email', getEmailByPseudo);

export default router;