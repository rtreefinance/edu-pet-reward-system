import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserRole } from '../shared/types';
import User from './models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pet-reward';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to ${MONGO_URI}`);

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create teacher
    const teacher = await User.findOneAndUpdate(
      { username: 'teacher1' },
      {
        username: 'teacher1',
        passwordHash,
        role: UserRole.Teacher,
        displayName: '张老师',
        subject: '数学',
        classIds: ['class-1'],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Teacher: ${teacher.username} (${teacher._id})`);

    // Create parent
    const parent = await User.findOneAndUpdate(
      { username: 'parent1' },
      {
        username: 'parent1',
        passwordHash,
        role: UserRole.Parent,
        displayName: '李爸爸',
        childrenIds: [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Parent: ${parent.username} (${parent._id})`);

    // Create students
    const student1 = await User.findOneAndUpdate(
      { username: 'student1' },
      {
        username: 'student1',
        passwordHash,
        role: UserRole.Student,
        displayName: '小明',
        coins: 100,
        level: 1,
        xp: 0,
        parentId: parent._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Student: ${student1.username} (${student1._id})`);

    const student2 = await User.findOneAndUpdate(
      { username: 'student2' },
      {
        username: 'student2',
        passwordHash,
        role: UserRole.Student,
        displayName: '小红',
        coins: 50,
        level: 1,
        xp: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Student: ${student2.username} (${student2._id})`);

    // Link children to parent
    await User.findByIdAndUpdate(parent._id, {
      childrenIds: [student1._id],
    });
    console.log(`Parent ${parent.username} linked to student ${student1.username}`);

    console.log('\n--- Seed Complete ---');
    console.log('  Teacher: teacher1 / password123');
    console.log('  Parent:  parent1  / password123');
    console.log('  Student: student1 / password123');
    console.log('  Student: student2 / password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
