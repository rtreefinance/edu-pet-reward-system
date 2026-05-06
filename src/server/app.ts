import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { startHungerDecayJob } from './jobs/hungerDecay';
import authRoutes from './routes/auth';
import homeworkRoutes from './routes/homework';
import checkinRoutes from './routes/checkin';
import petRoutes from './routes/pet';
import transactionRoutes from './routes/transaction';
import userRoutes from './routes/user';

// Load environment variables (if using .env)
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/pet', petRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Start ----
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pet-reward';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[MongoDB] Connected to ${MONGO_URI}`);

    // Start hunger decay cron job
    startHungerDecayJob();

    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();

export default app;
