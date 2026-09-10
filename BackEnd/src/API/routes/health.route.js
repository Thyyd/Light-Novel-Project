import { Router } from 'express';
import prisma from '../../db/client.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  }
  catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

export default router;
