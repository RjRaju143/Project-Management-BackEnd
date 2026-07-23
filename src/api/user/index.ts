import type { NextFunction, Request, Response } from "express";
import express from "express";
import { z } from "zod/v4";

import { authenticate } from "../../middlewares/auth.js";
import * as userService from "../../services/user-service.js";
import { loginSchema } from "../../validation/user.js";

const router = express.Router();

// POST /api/v1/user/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await userService.loginUser(validated, req);
    res.status(200).json(result);
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      const issues = err.issues.map(i => ({ field: i.path.join("."), message: i.message }));
      next(Object.assign(new Error(issues[0].message), { validation: issues }));
      return;
    }

    const code = (err as NodeJS.ErrnoException).code;
    if (code === "INVALID_CREDENTIALS") {
      res.status(401);
    }
    next(err);
  }
});

// POST /api/v1/user/logout
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie("crm.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// GET /api/v1/user/profile (protected)
router.get("/profile", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.requester!.id);
    res.status(200).json({ user });
  }
  catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "NOT_FOUND") {
      res.status(404);
    }
    next(err);
  }
});

export default router;
