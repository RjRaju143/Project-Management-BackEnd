import type { NextFunction, Request, Response } from "express";
import express from "express";
import { z } from "zod/v4";

import { authenticate } from "../../middlewares/auth.js";
import { logActivity } from "../../services/activity-service.js";
import * as leadService from "../../services/client-service.js";
import * as projectService from "../../services/lead-service.js";
import { clientListQuerySchema, createClientSchema, updateClientSchema } from "../../validation/client.js";

const router = express.Router();

router.use(authenticate);

// GET /api/v1/leads
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = clientListQuerySchema.parse(req.query);
    const result = await leadService.getClients(query);
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

// POST /api/v1/leads
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createClientSchema.parse(req.body);
    const client = await leadService.createClient(validated, req.requester!.id);
    await logActivity({ userId: req.requester!.id, action: "created", entity: "lead", entityId: (client._id as { toString: () => string }).toString(), entityName: client.organizationName || client.clientName });
    res.status(201).json({ message: "Lead created", client });
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

// GET /api/v1/leads/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await leadService.getClientById(String(req.params.id));
    res.status(200).json({ client });
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === "NOT_FOUND") res.status(404);
    next(err);
  }
});

// PATCH /api/v1/leads/:id
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateClientSchema.parse(req.body);
    const client = await leadService.updateClient(String(req.params.id), validated);
    await logActivity({ userId: req.requester!.id, action: "updated", entity: "lead", entityId: String(req.params.id), entityName: client.organizationName || client.clientName, changes: validated });
    res.status(200).json({ message: "Lead updated", client });
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
    next(err);
  }
});

// DELETE /api/v1/leads/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await leadService.getClientById(String(req.params.id));
    await leadService.deleteClient(String(req.params.id));
    await logActivity({ userId: req.requester!.id, action: "deleted", entity: "lead", entityId: String(req.params.id), entityName: client.organizationName || client.clientName });
    res.status(200).json({ message: "Lead deleted" });
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === "NOT_FOUND") res.status(404);
    next(err);
  }
});

// POST /api/v1/leads/:id/followup — creates a project from lead data
router.post("/:id/followup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await leadService.getClientById(String(req.params.id));

    if (client.followedUp) {
      res.status(409);
      next(new Error("This lead has already been followed up"));
      return;
    }

    const project = await projectService.createLead(
      {
        clientName: client.clientName,
        organizationName: client.organizationName,
        location: client.location,
        businessType: client.businessType,
        phone: client.phone,
        pincode: client.pincode,
        budget: client.budget,
        amount: client.amount,
        status: "Pending",
        timeline: client.timeline,
        description: client.description || "",
      },
      req.requester!.id,
    );

    await leadService.updateClient(String(req.params.id), { followedUp: true });
    await logActivity({ userId: req.requester!.id, action: "followed_up", entity: "lead", entityId: String(req.params.id), entityName: client.organizationName || client.clientName });

    res.status(201).json({ message: "Project created from lead", lead: project });
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === "NOT_FOUND") res.status(404);
    next(err);
  }
});

export default router;
