import type { AuthRole } from '@akiraminafit/contracts';

export type RequestUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
};

export type AppEnv = {
  Variables: {
    user: RequestUser;
  };
};
