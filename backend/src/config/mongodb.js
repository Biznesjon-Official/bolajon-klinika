import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// Use the correct MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mironshox:D1WVdeVfthVP1Z2F@cluster0.zthjn1c.mongodb.net/clinic_db?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;

export const connectMongoDB = async () => {
  if (isConnected) {
    logger.info('MongoDB already connected');
    return;
  }

  console.log('🔍 Connecting to MongoDB...');
  console.log('   Using hardcoded URI (temporary)');

  try {
    const options = {
      maxPoolSize: 100,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4,
      retryWrites: true,
      w: 'majority',
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 10000
    };

    await mongoose.connect(MONGODB_URI, options);
    
    isConnected = true;
    
    // Log database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📦 Connected to database:', dbName);
    
    logger.info('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectMongoDB = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnect error:', error);
    throw error;
  }
};

export default mongoose;
