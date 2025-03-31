// lib/db.ts
import mongoose, { Mongoose, ConnectOptions } from 'mongoose';

// Define the structure for the cached connection on the global object.
// This helps maintain a single connection pool across serverless function invocations
// or in development environments with module reloading.
// Using 'var' for global declaration, but TypeScript ensures type safety.
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

// Immediate check for the essential environment variable.
// Fail fast during application startup if it's missing.
if (!MONGODB_URI) {
  throw new Error(
    'FATAL ERROR: MONGODB_URI environment variable is not defined. Please check your .env file.'
  );
}

// Initialize the cache on the global object if it doesn't exist.
// Use `globalThis` for compatibility across different JavaScript environments.
let cached = globalThis.mongooseCache;
if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null };
}

/**
 * Establishes and manages a singleton connection to the MongoDB database using Mongoose.
 * It ensures that only one connection pool is created and reused across the application,
 * optimizing resource usage, especially in serverless environments.
 *
 * @async
 * @function connectDB
 * @returns {Promise<Mongoose>} A promise that resolves to the active Mongoose instance
 *                                once the connection is established or retrieved from cache.
 * @throws {Error} Throws an error if the database connection fails after attempting to connect.
 *                 Logs detailed error information to the console.
 *
 * @example
 * // In an API route or server component:
 * import connectDB from '@/lib/db';
 * import YourModel from '@/models/YourModel';
 *
 * export async function GET(request) {
 *   try {
 *     await connectDB(); // Ensure connection is established
 *     const data = await YourModel.find({});
 *     return Response.json(data);
 *   } catch (error) {
 *     console.error("API Error:", error);
 *     return Response.json({ message: "Internal Server Error" }, { status: 500 });
 *   }
 * }
 */
async function connectDB(): Promise<Mongoose> {
  // If a connection instance is already cached, return it immediately.
  if (cached.conn) {
    console.log('[DB] Using cached database connection.');
    return cached.conn;
  }

  // If a connection promise is already in progress, await it to avoid creating multiple connections concurrently.
  if (cached.promise) {
    console.log('[DB] Awaiting existing database connection promise.');
    try {
      const conn = await cached.promise;
      return conn;
    } catch (error) {
      // If the existing promise failed, clear it to allow a new attempt.
      cached.promise = null;
      console.error('[DB] Existing connection promise failed:', error);
      throw new Error(
        `Failed to establish database connection via existing promise. ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // No cached connection or promise found, establish a new connection.
  console.log('[DB] Attempting to establish a new database connection...');
  const opts: ConnectOptions = {
    // Recommended options for modern Mongoose/MongoDB versions.
    // bufferCommands: false is beneficial in serverless environments as it prevents
    // operations from buffering indefinitely if the connection is down.
    bufferCommands: false,
    // Consider adding other options if needed, e.g., serverSelectionTimeoutMS
    // serverSelectionTimeoutMS: 5000, // Example: Timeout after 5 seconds
  };

  try {
    // Store the connection *promise* in the cache immediately.
    // This handles concurrent calls to connectDB while the connection is pending.
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
        console.log('[DB] New database connection established successfully.');
        return mongooseInstance;
      });

    // Await the connection promise and store the resolved Mongoose instance in the cache.
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('[DB] Database connection error during initial connect:', error);
    // Reset the promise cache on failure to allow future connection attempts.
    cached.promise = null;
    // Re-throw a more informative error to be handled by the caller.
    throw new Error(
      `Failed to connect to database. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export default connectDB;