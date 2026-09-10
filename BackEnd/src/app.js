import express from 'express';
import cors from 'cors';
import healthRoute from './API/routes/health.route.js';
import { errorHandler, notFoundHandler } from './API/middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', healthRoute);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
