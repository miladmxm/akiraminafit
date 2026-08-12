import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db, accounts, sessions, users, verifications } from '@fitflow/db';
import { betterAuth } from 'better-auth';
import { admin, createAccessControl } from 'better-auth/plugins';
import { env } from './env.js';

export const statements = {
  students: ['list', 'create', 'invite'],
  exercises: ['list', 'create', 'update', 'delete'],
  plans: ['view', 'create', 'publish'],
  reports: ['view', 'create'],
  media: ['upload', 'delete'],
  workouts: ['view', 'update'],
} as const;

const access = createAccessControl(statements);

export const roles = {
  coach: access.newRole({
    students: ['list', 'create', 'invite'],
    exercises: ['list', 'create', 'update', 'delete'],
    plans: ['view', 'create', 'publish'],
    reports: ['view', 'create'],
    media: ['upload', 'delete'],
    workouts: ['view'],
  }),
  student: access.newRole({
    plans: ['view'],
    reports: ['view'],
    workouts: ['view', 'update'],
  }),
} as const;

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
  plugins: [
    admin({
      defaultRole: 'student',
      adminRoles: ['coach'],
      roles,
    }),
  ],
  user: {
    additionalFields: {
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

export type Session = typeof auth.$Infer.Session;
