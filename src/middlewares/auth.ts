import type { NextFunction, Request, Response } from "express";

import type { UserType } from "../models/user.js";
import User from "../models/user.js";

// Extend express-session to include our user data
declare module "express-session" {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface SessionData {
    userId: string;
    email: string;
    username: string;
    userType: UserType;
  }
}

// Extend Express Request to carry the authenticated requester
declare global {
  // eslint-disable-next-line ts/consistent-type-definitions
  namespace Express {
    interface Request {
      requester?: {
        id: string;
        email: string;
        username: string;
        userType: UserType;
      };
    }
  }
}

/**
 * Session-based auth middleware.
 * Validates session exists AND user still exists in the database.
 * If the user was deleted, the session is destroyed and 401 returned.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session || !req.session.userId) {
    res.status(401);
    next(new Error("Authentication required. Please log in."));
    return;
  }

  // Verify user still exists in DB
  const user = await User.findById(req.session.userId);
  if (!user) {
    // User was deleted — destroy session
    req.session.destroy(() => {});
    res.status(401);
    next(new Error("Your account no longer exists. Please contact an administrator."));
    return;
  }

  req.requester = {
    id: req.session.userId,
    email: req.session.email!,
    username: req.session.username!,
    userType: req.session.userType!,
  };

  next();
}
