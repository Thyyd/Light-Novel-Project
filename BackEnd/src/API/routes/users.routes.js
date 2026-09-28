import { Router } from 'express';
import { decodeToken } from '../middlewares/decodeToken.js';
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken.js';
import { registerUser, getEmailByPseudo, getMe } from '../controllers/users.controller.js';

const router = Router();

router.post('/', decodeToken, registerUser);

router.get('/email', getEmailByPseudo);
router.get('/me', verifyFirebaseToken, getMe);

export default router;