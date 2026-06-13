import type { UserRole } from "../models/User";

declare global {
  namespace Express {
    interface UserContext {
      id: string;
      role: UserRole;
      emailVerified: boolean;
    }

    interface Request {
      user?: UserContext;
    }
  }
}

export {};
