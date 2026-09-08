import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    autoIndex: env.NODE_ENV !== 'production'
  });

  logger.info({ dbName: env.MONGODB_DB_NAME }, 'MongoDB connected');
}

export function dbHealth() {
  const state = mongoose.connection.readyState;
  const status = ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown';
  return {
    state,
    status,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
}
