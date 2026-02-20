/**
 * Kassir va Dorixonachi test foydalanuvchilarini yaratish
 */
import { connectMongoDB } from './backend/src/config/mongodb.js';
import Staff from './backend/src/models/Staff.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'backend', '.env') });

async function createTestUsers() {
  await connectMongoDB();
  console.log('✅ MongoDB connected');

  const users = [
    {
      username: 'cashier',
      password: 'cashier123',
      plain_password: 'cashier123',
      first_name: 'Test',
      last_name: 'Kassir',
      role: 'cashier',
      phone: '+998901234567',
      status: 'active'
    },
    {
      username: 'pharmacist',
      password: 'pharmacist123',
      plain_password: 'pharmacist123',
      first_name: 'Test',
      last_name: 'Dorixonachi',
      role: 'pharmacist',
      phone: '+998901234568',
      status: 'active'
    }
  ];

  for (const userData of users) {
    const existing = await Staff.findOne({ username: userData.username });
    if (existing) {
      console.log(`⚠️  ${userData.username} allaqachon mavjud`);
      continue;
    }

    const staff = new Staff(userData);
    await staff.save();
    console.log(`✅ ${userData.role} (${userData.username}) yaratildi`);
  }

  console.log('\nBarcha foydalanuvchilar yaratildi!');
  process.exit(0);
}

createTestUsers().catch(err => {
  console.error('Xato:', err.message);
  process.exit(1);
});
