import { createMiddleware } from 'hono/factory';
import { db, users } from '@fitflow/db';
import { eq } from 'drizzle-orm';
import { auth } from '../auth.js';
import { env } from '../env.js';
import type { AppEnv, RequestUser } from '../types.js';

const demoUsers: Record<'coach' | 'student', RequestUser> = {
  coach: {
    id: 'demo-coach-user',
    name: 'مربی نمونه',
    email: 'coach@example.com',
    role: 'coach',
  },
  student: {
    id: 'demo-student-user',
    name: 'شاگرد نمونه',
    email: 'student@example.com',
    role: 'student',
  },
};

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (env.DEMO_MODE) {
    const demoRole = c.req.header('x-demo-role');
    if (demoRole === 'coach' || demoRole === 'student') {
      const fallback = demoUsers[demoRole];
      const [seeded] = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.email, fallback.email))
        .limit(1);
      c.set(
        'user',
        seeded ? { ...seeded, role: seeded.role === 'coach' ? 'coach' : 'student' } : fallback,
      );
      await next();
      return;
    }
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ message: 'برای ادامه وارد حساب شوید.' }, 401);
  }

  const role = session.user.role === 'coach' ? 'coach' : 'student';
  c.set('user', {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
  });
  await next();
});

export const requireRole = (role: 'coach' | 'student') =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (c.get('user').role !== role) {
      return c.json({ message: 'دسترسی مجاز نیست.' }, 403);
    }
    await next();
  });
