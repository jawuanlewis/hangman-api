import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import { connectToDB, closeConnection } from './config/db.js';
import gameRoutes from './routes/gameRoutes.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

// ========== CORS Configuration ========== //

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CUSTOM_URL,
  process.env.PROD_URL,
  process.env.STAGING_URL,
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const msg = 'CORS policy does not allow access from this origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

connectToDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== Middleware ========== //

// Security
app.use(helmet());
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/games', apiLimiter, gameRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// ========== HTTP Server ========== //

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

const gracefulShutdown = async (signal) => {
  console.log(`\nℹ️ ${signal} received. Starting graceful shutdown...`);

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
