import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db, accounts, sessions, users, verifications } from '@fitflow/db';
import { betterAuth } from 'better-auth';
import { env } from './env.js';

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.WEB_ORIGIN],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'student',
        input: false,
      },
      phone: { type: 'string', required: false },
      timezone: { type: 'string', required: true, defaultValue: 'Asia/Tehran' },
      locale: { type: 'string', required: true, defaultValue: 'fa-IR' },
      isActive: { type: 'boolean', required: true, defaultValue: true, input: false },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
});
