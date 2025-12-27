import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

let client = null;
let isConnected = false;

// ========== DB Connection ========== //

async function connectToDB() {
  try {
    if (!isConnected) {
      // Create client lazily to allow test environment to set MONGO_URI first
      if (!client) {
        const uri = process.env.MONGO_URI;
        client = new MongoClient(uri);
      }
      await client.connect();
      isConnected = true;
      console.log('✅ Connected to database');

      // Create TTL index for automatic game cleanup (24 hours)
      const db = client.db(process.env.DB_NAME);
      await db
        .collection('games')
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }
    return client.db(process.env.DB_NAME);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw error;
  }
}

async function getRandomWord(category) {
  const db = await connectToDB();
  const collection = db.collection('words');

  const randomWord = await collection
    .aggregate([
      { $match: { category: category } },
      { $sample: { size: 1 } },
      { $project: { _id: 0, word: 1 } },
    ])
    .toArray();

  return randomWord.length > 0 ? randomWord[0].word : null;
}

async function closeConnection() {
  if (isConnected) {
    console.log('ℹ️  Closing database connection');
    await client.close();
    isConnected = false;
  }
}

// ========== Game CRUD Operations ========== //

async function createGame(gameData) {
  const db = await connectToDB();
  const collection = db.collection('games');

  const game = {
    ...gameData,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  const result = await collection.insertOne(game);
  return result.insertedId;
}

async function getGameById(gameId) {
  const db = await connectToDB();
  const collection = db.collection('games');

  return await collection.findOne({ _id: new ObjectId(gameId) });
}

async function updateGame(gameId, updateData) {
  const db = await connectToDB();
  const collection = db.collection('games');

  const result = await collection.updateOne(
    { _id: new ObjectId(gameId) },
    { $set: updateData }
  );

  return result.modifiedCount > 0;
}

async function deleteGame(gameId) {
  const db = await connectToDB();
  const collection = db.collection('games');

  const result = await collection.deleteOne({ _id: new ObjectId(gameId) });
  return result.deletedCount > 0;
}

export {
  connectToDB,
  getRandomWord,
  closeConnection,
  createGame,
  getGameById,
  updateGame,
  deleteGame,
};
