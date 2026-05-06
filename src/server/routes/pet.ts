import { Router, Response } from 'express';
import { TransactionType, COIN_REWARDS } from '../../shared/types';
import { Pet, Transaction, User } from '../models';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

router.use(authenticate);

// Shop items (fixed data)
const SHOP_ITEMS = [
  { _id: 'shop_001', name: '红色蝴蝶结', icon: '🎀', price: 20, type: 'accessory' },
  { _id: 'shop_002', name: '小皇冠', icon: '👑', price: 50, type: 'accessory' },
  { _id: 'shop_003', name: '墨镜', icon: '🕶️', price: 30, type: 'accessory' },
  { _id: 'shop_004', name: '围巾', icon: '🧣', price: 15, type: 'accessory' },
  { _id: 'shop_005', name: '星星发卡', icon: '⭐', price: 25, type: 'accessory' },
  { _id: 'shop_006', name: '火焰皮肤', icon: '🔥', price: 100, type: 'skin' },
  { _id: 'shop_007', name: '冰霜皮肤', icon: '❄️', price: 100, type: 'skin' },
  { _id: 'shop_008', name: '彩虹皮肤', icon: '🌈', price: 150, type: 'skin' },
];

// GET /api/pet - view own pet
router.get('/', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const pet = await Pet.findOne({ studentId: req.user!._id });
    if (!pet) {
      res.status(404).json({ error: '还没有领养宠物', hasPet: false });
      return;
    }
    res.json({ pet: pet.toJSON(), hasPet: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取宠物失败' });
  }
});

// POST /api/pet - adopt a pet
router.post('/', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!._id;

    // Check if student already has a pet
    const existing = await Pet.findOne({ studentId });
    if (existing) {
      res.status(400).json({ error: '你已经领养过宠物了' });
      return;
    }

    const { name, species } = req.body;
    if (!name || !species) {
      res.status(400).json({ error: '缺少必填字段: name, species' });
      return;
    }

    const pet = await Pet.create({
      studentId,
      name,
      species,
      level: 1,
      xp: 0,
      hunger: 100,
      mood: 100,
      lastFedAt: new Date(),
      accessories: [],
      skin: `${species}_base`,
      evolutionHistory: [],
    });

    res.status(201).json({ pet: pet.toJSON() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '领养宠物失败' });
  }
});

// POST /api/pet/feed - feed pet (costs 5 coins)
router.post('/feed', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!._id;

    const pet = await Pet.findOne({ studentId });
    if (!pet) {
      res.status(404).json({ error: '还没有领养宠物' });
      return;
    }

    if (pet.hunger >= 100) {
      res.status(400).json({ error: '宠物已经吃饱了' });
      return;
    }

    // Deduct coins via Transaction.record
    await Transaction.record({
      studentId,
      type: TransactionType.FeedPet,
      amount: -COIN_REWARDS.FEED_PET_COST,
      reference: { model: 'Pet', id: pet._id.toString() },
      description: '喂食宠物',
    });

    // Feed the pet
    const result = pet.feed();
    await pet.save();

    // Get updated balance
    const student = await User.findById(studentId);

    res.json({
      hunger: result.hunger,
      mood: result.mood,
      coins: student?.coins ?? 0,
      pet: pet.toJSON(),
    });
  } catch (err: any) {
    // Check if it's insufficient coins
    if (err.message?.includes('Insufficient coins')) {
      res.status(400).json({ error: '金币不足，无法喂食' });
      return;
    }
    res.status(400).json({ error: err.message || '喂食失败' });
  }
});

// GET /api/pet/shop - shop items
router.get('/shop', (_req: AuthRequest, res: Response) => {
  res.json({ items: SHOP_ITEMS });
});

// POST /api/pet/buy-accessory - purchase accessory
router.post('/buy-accessory', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!._id;
    const { name, icon, price } = req.body;

    if (!name || !icon || price === undefined) {
      res.status(400).json({ error: '缺少必填字段: name, icon, price' });
      return;
    }

    const pet = await Pet.findOne({ studentId });
    if (!pet) {
      res.status(404).json({ error: '还没有领养宠物' });
      return;
    }

    // Check if already owned
    const alreadyOwned = pet.accessories.some((a) => a.name === name);
    if (alreadyOwned) {
      res.status(400).json({ error: '已经拥有该装饰品' });
      return;
    }

    // Deduct coins via Transaction.record
    await Transaction.record({
      studentId,
      type: TransactionType.BuyAccessory,
      amount: -price,
      reference: { model: 'Pet', id: pet._id.toString() },
      description: `购买装饰品: ${name}`,
    });

    // Add accessory to pet
    pet.accessories.push({
      name,
      icon,
      purchasedAt: new Date(),
    });
    await pet.save();

    const student = await User.findById(studentId);

    res.json({
      accessory: { name, icon },
      coins: student?.coins ?? 0,
      pet: pet.toJSON(),
    });
  } catch (err: any) {
    if (err.message?.includes('Insufficient coins')) {
      res.status(400).json({ error: '金币不足，无法购买' });
      return;
    }
    res.status(400).json({ error: err.message || '购买装饰品失败' });
  }
});

// GET /api/pet/child/:childId - parent view child's pet
router.get('/child/:childId', requireRole(UserRole.Parent), async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user!._id;
    const { childId } = req.params;

    // Verify parent-children relationship
    const parent = await User.findById(parentId);
    if (!parent || !parent.childrenIds?.some((id: any) => id.toString() === childId)) {
      res.status(403).json({ error: '无权查看此孩子的宠物' });
      return;
    }

    const pet = await Pet.findOne({ studentId: childId });
    if (!pet) {
      res.status(404).json({ error: '该孩子还没有领养宠物', hasPet: false });
      return;
    }
    res.json({ pet: pet.toJSON(), hasPet: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取宠物失败' });
  }
});

// GET /api/pet/evolution - evolution history
router.get('/evolution', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const pet = await Pet.findOne({ studentId: req.user!._id });
    if (!pet) {
      res.status(404).json({ error: '还没有领养宠物' });
      return;
    }

    res.json({
      currentLevel: pet.level,
      currentSkin: pet.skin,
      evolutionHistory: pet.evolutionHistory,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取进化历史失败' });
  }
});

export default router;
