import app from './app.js';
import { connectToDB, closeConnection } from './config/db.js';

const PORT = process.env.PORT || 3000;

// Connect to database
connectToDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handler
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
