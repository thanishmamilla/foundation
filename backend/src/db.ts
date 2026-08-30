import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://thanishmamilla:thanish123@cluster0.1x0tmmk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3s
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully.');
    return true;
  } catch (error) {
    isConnected = false;
    console.warn('⚠️ MongoDB connection failed. Falling back to In-Memory storage.');
    console.warn(`Error details: ${(error as Error).message}`);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
