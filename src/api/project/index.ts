import type { NextFunction, Request, Response } from "express";
import express from "express";
import { z } from "zod/v4";

import { authenticate } from "../../middlewares/auth.js";
import * as projectService from "../../services/lead-service.js";
import { leadListQuerySchema, updateLeadSchema } from "../../validation/lead.js";

const router = express.Router();

router.use(authenticate);

// GET /api/v1/projects
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = leadListQuerySchema.parse(req.query);
    const result = await projectService.getLeads(query, req.requester!.id);
    res.status(200).json(result);
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      const issues = err.issues.map(i => ({ field: i.path.join("."), message: i.message }));
      next(Object.assign(new Error(issues[0].message), { validation: issues }));
      return;
    }
    next(err);
  }
});

// GET /api/v1/projects/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await projectService.getLeadById(String(req.params.id), req.requester!.id);
    res.status(200).json({ lead });
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === "NOT_FOUND") res.status(404);
    next(err);
  }
});

// PATCH /api/v1/projects/:id
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateLeadSchema.parse(req.body);
    const lead = await projectService.updateLead(String(req.params.id), validated, req.requester!.id);
    res.status(200).json({ message: "Project updated", lead });
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      const issues = err.issues.map(i => ({ field: i.path.join("."), message: i.message }));
      next(Object.assign(new Error(issues[0].message), { validation: issues }));
      return;
    }
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "NOT_FOUND") res.status(404);
    if (code === "STATUS_LOCKED") res.status(403);
    if (code === "REASON_REQUIRED") res.status(400);
    next(err);
  }
});

// DELETE /api/v1/projects/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectService.deleteLead(String(req.params.id), req.requester!.id);
    res.status(200).json({ message: "Project deleted" });
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === "NOT_FOUND") res.status(404);
    next(err);
  }
});

export default router;
