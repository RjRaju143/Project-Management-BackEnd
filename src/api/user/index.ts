import type { NextFunction, Request, Response } from "express";
import express from "express";
import { z } from "zod/v4";

import { authenticate } from "../../middlewares/auth.js";
import * as userService from "../../services/user-service.js";
import { inviteUserSchema, loginSchema, registerSchema } from "../../validation/user.js";

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

// POST /api/v1/user/invite (protected, admin only)
router.post("/invite", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only admins can invite new users
    if (req.requester!.userType !== "admin") {
      res.status(403);
      next(new Error("Only admins can invite new users"));
      return;
    }

    const validated = inviteUserSchema.parse(req.body);
    const { invite, inviteLink } = await userService.inviteUser(validated, req.requester!.id);
    res.status(201).json({
      message: "Invitation sent successfully",
      inviteLink,
      invite: {
        id: (invite._id as { toString: () => string }).toString(),
        firstName: invite.firstName,
        lastName: invite.lastName,
        username: invite.username,
        email: invite.email,
        userType: invite.userType,
        expiresAt: invite.expiresAt,
      },
    });
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      const issues = err.issues.map(i => ({ field: i.path.join("."), message: i.message }));
      next(Object.assign(new Error(issues[0].message), { validation: issues }));
      return;
    }
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "DUPLICATE_EMAIL" || code === "DUPLICATE_USERNAME") {
      res.status(409);
    }
    next(err);
  }
});

// GET /api/v1/user/invites (protected, admin only) — list all invites by this admin
router.get("/invites", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.requester!.userType !== "admin") {
      res.status(403);
      next(new Error("Only admins can view invites"));
      return;
    }

    const invites = await userService.getInvitesByUser(req.requester!.id);
    res.status(200).json({
      invites: invites.map(inv => ({
        id: (inv._id as { toString: () => string }).toString(),
        firstName: inv.firstName,
        lastName: inv.lastName,
        username: inv.username,
        email: inv.email,
        userType: inv.userType,
        accepted: inv.accepted,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    });
  }
  catch (err) {
    next(err);
  }
});

// GET /api/v1/user/invite/:token — validate invite token (public)
router.get("/invite/:token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invite = await userService.getInviteByToken(String(req.params.token));
    res.status(200).json({
      invite: {
        firstName: invite.firstName,
        lastName: invite.lastName,
        username: invite.username,
        email: invite.email,
        userType: invite.userType,
      },
    });
  }
  catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "INVITE_INVALID" || code === "INVITE_EXPIRED") {
      res.status(400);
    }
    next(err);
  }
});

// POST /api/v1/user/register — accept invite and set password (public)
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await userService.registerWithInvite(validated);
    res.status(201).json({
      message: "Registration successful. You can now log in.",
      user: {
        id: (user._id as { toString: () => string }).toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        userType: user.userType,
      },
    });
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      const issues = err.issues.map(i => ({ field: i.path.join("."), message: i.message }));
      next(Object.assign(new Error(issues[0].message), { validation: issues }));
      return;
    }
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "INVITE_INVALID" || code === "INVITE_EXPIRED") {
      res.status(400);
    }
    if (code === "DUPLICATE_EMAIL" || code === "DUPLICATE_USERNAME") {
      res.status(409);
    }
    next(err);
  }
});

export default router;
