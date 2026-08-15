import { isAuthRole, type AuthPermission } from '@akiraminafit/contracts';
import { createMiddleware } from 'hono/factory';
import { auth } from '../auth.js';
import type { AppEnv } from '../types.js';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ message: 'برای ادامه وارد حساب شوید.' }, 401);
  }

  const role = typeof session.user.role === 'string' ? session.user.role : undefined;
  if (!isAuthRole(role)) {
    return c.json({ message: 'نقش حساب کاربری معتبر نیست.' }, 403);
  }

  c.set('user', {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
  });
  await next();
});

export const requirePermission = (permissions: AuthPermission) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    const result = await auth.api.userHasPermission({
      body: {
        userId: user.id,
        role: user.role,
        permissions,
      },
    });

    if (!result.success) {
      return c.json({ message: 'دسترسی مجاز نیست.' }, 403);
    }

    await next();
  });
