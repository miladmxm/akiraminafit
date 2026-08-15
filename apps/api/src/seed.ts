import { auth } from './auth.js';
import { env } from './env.js';

const authContext = await auth.$context;
const existing = await authContext.internalAdapter.findUserByEmail(env.ADMIN_EMAIL);

if (!existing) {
  const { user } = await auth.api.createUser({
    body: {
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      password: env.ADMIN_PASSWORD,
      role: 'coach',
      data: {
        timezone: 'Asia/Tehran',
        locale: 'fa-IR',
        isActive: true,
      },
    },
  });

  console.log(`Coach account created: ${user.email}`);
} else {
  console.log(`Coach account already exists: ${existing.user.email}`);
}
