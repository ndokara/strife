import { connect } from 'mongoose';

require('dotenv').config();

export async function connectDb() {
  try {
    await connect(process.env.MONGO_URI!);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    }
    process.exit(1); // Exit the process with failure
  }
}
