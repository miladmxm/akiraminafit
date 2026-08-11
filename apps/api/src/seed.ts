import { accounts, db, users } from '@fitflow/db';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import './env.js';

const adminEnvSchema = z.object({
  ADMIN_NAME: z.string().trim().min(2, 'ADMIN_NAME must contain at least 2 characters.'),
  ADMIN_EMAIL: z.string().trim().toLowerCase().email('ADMIN_EMAIL must be a valid email address.'),
  ADMIN_PASSWORD: z
    .string()
    .min(12, 'ADMIN_PASSWORD must contain at least 12 characters.')
    .max(128, 'ADMIN_PASSWORD must contain at most 128 characters.'),
});

function readAdminEnv() {
  const result = adminEnvSchema.safeParse(process.env);
  if (result.success) return result.data;

  const details = result.error.issues
    .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Primary coach seed configuration is invalid. Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD.\n${details}`,
  );
}

async function ensurePrimaryCoach() {
  const input = readAdminEnv();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.ADMIN_EMAIL))
    .limit(1);

  const [coach] = existing
    ? await db
        .update(users)
        .set({
          name: input.ADMIN_NAME,
          role: 'coach',
          emailVerified: true,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning()
    : await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          name: input.ADMIN_NAME,
          email: input.ADMIN_EMAIL,
          emailVerified: true,
          role: 'coach',
          isActive: true,
        })
        .returning();

  if (!coach) throw new Error('Could not create or update the primary coach account.');

  const [credentialAccount] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, coach.id), eq(accounts.providerId, 'credential')))
    .limit(1);
  const passwordMatches = credentialAccount?.password
    ? await verifyPassword({ hash: credentialAccount.password, password: input.ADMIN_PASSWORD })
    : false;

  if (!passwordMatches) {
    const password = await hashPassword(input.ADMIN_PASSWORD);
    if (credentialAccount) {
      await db
        .update(accounts)
        .set({ password, updatedAt: new Date() })
        .where(eq(accounts.id, credentialAccount.id));
    } else {
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: coach.id,
        providerId: 'credential',
        userId: coach.id,
        password,
      });
    }
  }

  return { coach, created: !existing, passwordChanged: !passwordMatches };
}

async function main() {
  const { coach, created, passwordChanged } = await ensurePrimaryCoach();
  const action = created ? 'created' : 'updated';
  const passwordStatus = passwordChanged ? ' Password synchronized from ADMIN_PASSWORD.' : '';
  console.log(`Primary coach ${action}: ${coach.email}.${passwordStatus}`);
  console.log('No students, exercises, plans, workouts, or reports were seeded.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
