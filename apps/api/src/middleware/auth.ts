import { createMiddleware } from 'hono/factory';
import { auth } from '../auth.js';
import type { AppEnv } from '../types.js';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
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
