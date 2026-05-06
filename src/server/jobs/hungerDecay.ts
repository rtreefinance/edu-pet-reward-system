import cron from 'node-cron';
import Pet from '../models/Pet';

/**
 * Hunger decay cron job.
 * Runs every 5 minutes. Applies -20 hunger to pets not fed in 24 hours.
 */
export function startHungerDecayJob(): cron.ScheduledTask {
  const task = cron.schedule('*/5 * * * *', async () => {
    try {
      const count = await Pet.applyHungerDecay();
      if (count > 0) {
        console.log(`[HungerDecay] Applied hunger decay to ${count} pet(s)`);
      }

      // Log pets with critically low hunger
      const critical = await Pet.countDocuments({ hunger: { $lt: 20 } });
      if (critical > 0) {
        console.warn(`[HungerDecay] ${critical} pet(s) have critically low hunger (< 20)`);
      }
    } catch (err) {
      console.error('[HungerDecay] Error applying hunger decay:', err);
    }
  });

  console.log('[HungerDecay] Cron job started (every 5 minutes)');
  return task;
}
