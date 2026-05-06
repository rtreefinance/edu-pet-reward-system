import mongoose, { Schema, Document, Model } from 'mongoose';

// ---- Sub-document interfaces ----

export interface IAccessory {
  name: string;
  icon: string;
  purchasedAt: Date;
}

export interface IEvolutionRecord {
  fromLevel: number;
  toLevel: number;
  newSpecies: string;
  triggeredAt: Date;
}

// ---- Main interface ----

export interface IPet extends Document {
  studentId: mongoose.Types.ObjectId;
  name: string;
  species: string;
  level: number;          // 1–100
  xp: number;
  hunger: number;         // 0–100; cron -20 every 24h
  mood: number;           // 0–100
  lastFedAt: Date;
  accessories: IAccessory[];
  skin: string;
  evolutionHistory: IEvolutionRecord[];
  createdAt: Date;
  updatedAt: Date;
}

// ---- Sub-schemas ----

const AccessorySchema = new Schema<IAccessory>(
  { name: String, icon: String, purchasedAt: { type: Date, default: Date.now } },
  { _id: false },
);

const EvolutionRecordSchema = new Schema<IEvolutionRecord>(
  {
    fromLevel: Number,
    toLevel: Number,
    newSpecies: String,
    triggeredAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ---- Evolution helpers ----

/**
 * Stage thresholds (descending order for match):
 *   50+  → ultimate
 *   10+  → stage4
 *    6+  → stage3
 *    3+  → stage2
 *    1-2  → base
 */
const STAGES: [number, string][] = [[50, 'ultimate'], [10, 'stage4'], [6, 'stage3'], [3, 'stage2']];

function stageSuffix(level: number): string {
  for (const [t, s] of STAGES) if (level >= t) return s;
  return 'base';
}

function computeSkin(species: string, level: number): string {
  return `${species}_${stageSuffix(level)}`;
}

function detectEvolution(
  oldLv: number, newLv: number, species: string,
): IEvolutionRecord | null {
  if (stageSuffix(oldLv) !== stageSuffix(newLv)) {
    return {
      fromLevel: oldLv,
      toLevel: newLv,
      newSpecies: computeSkin(species, newLv),
      triggeredAt: new Date(),
    };
  }
  return null;
}

// ---- Main Schema ----

const PetSchema = new Schema<IPet>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 30 },
    species: { type: String, required: true, trim: true },
    level: { type: Number, default: 1, min: 1, max: 100 },
    xp: { type: Number, default: 0, min: 0 },
    hunger: { type: Number, default: 100, min: 0, max: 100 },
    mood: { type: Number, default: 100, min: 0, max: 100 },
    lastFedAt: { type: Date, default: Date.now },
    accessories: [AccessorySchema],
    skin: { type: String, default: '' },
    evolutionHistory: [EvolutionRecordSchema],
  },
  { timestamps: true },
);

// ---- Pre-save hooks ----

PetSchema.pre('save', function (next) {
  if (this.isModified('level')) {
    const old = (this as any).__prevLevel ?? 1;
    this.skin = computeSkin(this.species, this.level);
    const evo = detectEvolution(old, this.level, this.species);
    if (evo) this.evolutionHistory.push(evo);
  }
  if (!this.skin) this.skin = computeSkin(this.species, this.level);
  next();
});

// After save, stash current level for next comparison
PetSchema.post('save', function () {
  (this as any).__prevLevel = this.level;
});

// ---- Instance: feed ----

PetSchema.methods.feed = function (): { hunger: number; mood: number } {
  this.hunger = Math.min(this.hunger + 20, 100);
  this.mood = Math.min(this.mood + 10, 100);
  this.lastFedAt = new Date();
  return { hunger: this.hunger, mood: this.mood };
};

// ---- Static: hunger decay (cron) ----

PetSchema.statics.applyHungerDecay = async function (): Promise<number> {
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const r = await this.updateMany(
    { lastFedAt: { $lt: threshold }, hunger: { $gt: 0 } },
    { $inc: { hunger: -20 } },
  );
  return r.modifiedCount;
};

// ---- Type exports ----

export interface IPetMethods {
  feed(): { hunger: number; mood: number };
}

export interface IPetModel extends Model<IPet, {}, IPetMethods> {
  applyHungerDecay(): Promise<number>;
}

// ---- Export ----

const Pet = mongoose.model<IPet, IPetModel>('Pet', PetSchema) as IPetModel;

export default Pet;
