// NOTE: Using Express 5.x for improved performance and modern async error handling.
// Express 5 introduces breaking changes from v4 - see migration guide if updating dependencies.
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import { connectToDB, closeConnection } from './config/db.js';
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

// Database connection and server startup
const PORT = process.env.PORT || 3000;

connectToDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

const gracefulShutdown = async (signal) => {
  console.log(`\nℹ️  ${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('✅ HTTP server closed');
    await closeConnection();
    console.log('✅ Database connection closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
