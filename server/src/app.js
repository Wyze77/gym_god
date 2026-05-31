import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// --- Core middleware ---
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// --- API ---
app.get('/', (_req, res) => res.json({ name: 'FitSync API', docs: '/api/health' }));
app.use('/api', apiRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
