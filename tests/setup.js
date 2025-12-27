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

  // Seed initial test data
  await seedTestData();
});

// Seed test data
async function seedTestData() {
  if (!db) return;

  const wordsCollection = db.collection('words');

  // Add test words for each category
  const testWords = [
    { category: 'movies', word: 'JAWS' },
    { category: 'movies', word: 'THE MATRIX' },
    { category: 'video games', word: 'MINECRAFT' },
    { category: 'video games', word: 'FORTNITE' },
    { category: 'sports', word: 'SOCCER' },
    { category: 'sports', word: 'BASKETBALL' },
    { category: 'idioms', word: 'BREAK THE ICE' },
    { category: 'idioms', word: 'BITE THE BULLET' },
    { category: 'tv shows', word: 'FRIENDS' },
    { category: 'tv shows', word: 'THE OFFICE' },
    { category: 'food', word: 'PIZZA' },
    { category: 'food', word: 'HAMBURGER' },
    { category: 'animals', word: 'ELEPHANT' },
    { category: 'animals', word: 'TIGER' },
    { category: 'cities', word: 'TOKYO' },
    { category: 'cities', word: 'PARIS' },
  ];

  await wordsCollection.insertMany(testWords);
}

// Clean up database after each test to ensure isolation
afterEach(async () => {
  if (db) {
    const collections = await db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    // Re-seed test data for next test
    await seedTestData();
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
