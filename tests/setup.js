import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Set up static test environment variables IMMEDIATELY (before any imports)
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRY = '24h';
process.env.PORT = '3001';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3000';

let mongoServer;
let mongoClient;
let db;

// Start MongoDB Memory Server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set MongoDB-specific env vars with the test server URI
  process.env.MONGO_URI = uri;
  process.env.DB_NAME = 'hangman-test';

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();

  db = mongoClient.db('hangman-test');

  // Set the database globally so tests can access it
  globalThis.testDb = db;
  globalThis.testDbUri = uri;
});

// Clean up database after each test to ensure isolation
afterEach(async () => {
  if (db) {
    const collections = await db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// Clean up after all tests
afterAll(async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
