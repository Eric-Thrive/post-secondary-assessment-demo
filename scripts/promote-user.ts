import { exit } from 'process';
import { eq } from 'drizzle-orm';
import { db } from '../apps/server/db';
import { users } from '@shared/schema';

async function promoteUser(username: string) {
  const trimmed = username.trim();

  if (!trimmed) {
    console.error('Username cannot be empty.');
    exit(1);
  }

  const [updatedUser] = await db
    .update(users)
    .set({ role: 'system_admin' })
    .where(eq(users.username, trimmed))
    .returning({ id: users.id, username: users.username, role: users.role });

  if (!updatedUser) {
    console.error(`User '${trimmed}' not found.`);
    exit(1);
  }

  console.log(`✅ User '${updatedUser.username}' is now a ${updatedUser.role}.`);
}

const [, , username] = process.argv;

if (!username) {
  console.error('Usage: tsx --env-file=.env scripts/promote-user.ts <username>');
  exit(1);
}

promoteUser(username)
  .then(() => {
    console.log('Promotion completed successfully.');
    exit(0);
  })
  .catch((error) => {
    console.error('Failed to promote user:', error);
    exit(1);
  });
