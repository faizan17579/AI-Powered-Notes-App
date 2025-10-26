import mongoose from 'mongoose';

// Global mongoose cache to avoid multiple connections in development
const global = globalThis as unknown as {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

// Initialize global mongoose cache if it doesn't exist
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB using mongoose
 * Uses global cache to prevent multiple connections in development
 * @returns Promise<mongoose.Mongoose> - The mongoose instance
 */
async function connectToDatabase(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  // Return existing promise if connection is in progress
  if (global.mongoose.promise) {
    return global.mongoose.promise;
  }

  // Get MongoDB URI from environment variables
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  // Create new connection promise
  global.mongoose.promise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false, // Disable mongoose buffering
  });

  try {
    // Wait for connection to complete
    global.mongoose.conn = await global.mongoose.promise;
    console.log('Successfully connected to MongoDB');
    return global.mongoose.conn;
  } catch (error) {
    // Reset promise on error to allow retry
    global.mongoose.promise = null;
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export default connectToDatabase;
