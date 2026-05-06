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

// Serve built React SPA from /app/public (Docker) or ../../dist-client (local dev)
import path from 'path';
const publicDir = path.join(__dirname, '..', '..', '..', 'public');
app.use(express.static(publicDir));

// SPA fallback: any non-API route returns index.html
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) {
      // During API-only development (no client build), return a friendly message
      res.status(200).send(
        '<h2>Pet Reward API Server</h2><p>API is running. Frontend not built yet — run <code>npm run build</code> in src/client/.</p>'
      );
    }
  });
});

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
