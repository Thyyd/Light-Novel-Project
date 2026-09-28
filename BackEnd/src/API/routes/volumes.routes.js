import { Router } from 'express';
import { getVolumeDetails } from '../controllers/volumes.controller.js';

const router = Router();

router.get('/:id', getVolumeDetails);

export default router;