import express from 'express';
import cors from 'cors';
import healthRoute from './API/routes/health.route.js';
import usersRouter from './API/routes/users.routes.js';
import seriesRouter from './API/routes/series.routes.js';
import volumesRouter from './API/routes/volumes.routes.js';
import { errorHandler, notFoundHandler } from './API/middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', healthRoute);

app.use('/api/users', usersRouter);

app.use('/api/series', seriesRouter);

app.use('/api/volumes', volumesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
