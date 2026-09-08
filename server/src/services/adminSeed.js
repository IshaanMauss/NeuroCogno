import { adminSeedUsers } from '../config/env.js';
import { logger } from '../config/logger.js';
import { User } from '../models/User.js';

export async function seedAdmins() {
  const users = adminSeedUsers();

  for (const account of users) {
    if (!account.email || !account.username || !account.password || !account.role || !account.name) continue;

    const existing = await User.findOne({
      $or: [{ email: account.email.toLowerCase() }, { username: account.username.toLowerCase() }]
    });
    if (existing) continue;

    await User.create({
      name: account.name,
      username: account.username.toLowerCase(),
      email: account.email.toLowerCase(),
      role: account.role,
      passwordHash: await User.hashPassword(account.password)
    });

    logger.info({ email: account.email, role: account.role }, 'Seeded admin user');
  }
}
