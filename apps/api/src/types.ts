import type { UserRole } from '@fitflow/contracts';

export type RequestUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AppEnv = {
  Variables: {
    user: RequestUser;
  };
};
