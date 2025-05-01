import { connect } from 'mongoose';
import { config } from 'dotenv';

config();

export async function connectDb() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    await connect(mongoUri);
    console.log('Connected to MongoDB.');
  } catch (err) {
    if (err instanceof Error) {
      console.error('Failed to connect to MongoDB:', err.message);
    }
    process.exit(1);
  }
}
