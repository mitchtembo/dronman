// src/lib/dbConnect.js
import mongoose from 'mongoose';

// Try both possible environment variable names
const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI 

if (!MONGODB_URI) {
  console.error('Environment variables available:', Object.keys(process.env));
  throw new Error(
    'Please define either MONGODB_URI or NEXT_PUBLIC_MONGODB_URI environment variable inside .env.local'
  );
}

console.log('Attempting to connect to MongoDB with URI starting with:', MONGODB_URI.substring(0, MONGODB_URI.indexOf('@')));

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially during API routes hot reloads.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    mongoose.set('strictQuery', false);
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
