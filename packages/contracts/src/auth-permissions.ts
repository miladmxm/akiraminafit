import { createAccessControl } from 'better-auth/plugins/access';

export const authStatements = {
  students: ['list', 'create', 'invite'],
  exercises: ['list', 'create', 'update', 'delete'],
  plans: ['view', 'create', 'publish'],
  reports: ['view', 'create'],
  media: ['upload', 'delete'],
  workouts: ['view', 'update'],
} as const;

export const authAccessControl = createAccessControl(authStatements);

export const authRoles = {
  coach: authAccessControl.newRole({
    students: ['list', 'create', 'invite'],
    exercises: ['list', 'create', 'update', 'delete'],
    plans: ['view', 'create', 'publish'],
    reports: ['view', 'create'],
    media: ['upload', 'delete'],
    workouts: ['view'],
  }),
  student: authAccessControl.newRole({
    plans: ['view'],
    reports: ['view'],
    workouts: ['view', 'update'],
  }),
} as const;

export type AuthRole = keyof typeof authRoles;
export type AuthResource = keyof typeof authStatements;
export type AuthPermission = {
  [Resource in AuthResource]?: Array<(typeof authStatements)[Resource][number]>;
};

export function isAuthRole(role: string | null | undefined): role is AuthRole {
  return Boolean(role && Object.hasOwn(authRoles, role));
}
