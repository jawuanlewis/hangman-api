// NOTE: Using Express 5.x for improved performance and modern async error handling.
// Express 5 introduces breaking changes from v4 - see migration guide if updating dependencies.
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import { corsOptions } from './config/cors.js';
import gameRoutes from './routes/gameRoutes.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

// CORS configuration
app.use(cors(corsOptions));

// Security
app.use(helmet());
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes with rate limiting
app.use('/api/v1/games', apiLimiter, gameRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
