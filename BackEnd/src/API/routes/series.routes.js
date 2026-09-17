import { Router } from 'express';
import { decodeToken } from '../middlewares/decodeToken.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { upload } from '../middlewares/upload.js';
import { createSerie } from '../controllers/series.controller.js';
import { createVolume } from '../controllers/volumes.controller.js';

const router = Router();

router.post('/', decodeToken, requireAdmin, upload.single('cover'), createSerie);
router.post('/:id/volumes', decodeToken, requireAdmin, upload.single('cover'), createVolume);

export default router;