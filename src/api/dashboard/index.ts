import type { NextFunction, Request, Response } from "express";
import express from "express";

import { authenticate } from "../../middlewares/auth.js";
import Client from "../../models/client.js";
import Lead from "../../models/lead.js";

const router = express.Router();

router.use(authenticate);

// GET /api/v1/dashboard/stats
router.get("/stats", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Lead (Client model) stats by status
    const leadStatusCounts = await Client.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Project (Lead model) stats by status
    const projectStatusCounts = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Leads created per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const leadsPerMonth = await Client.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Projects created per month (last 6 months)
    const projectsPerMonth = await Lead.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Total counts
    const totalLeads = await Client.countDocuments();
    const totalProjects = await Lead.countDocuments();

    // Budget totals
    const leadBudgetAgg = await Client.aggregate([
      { $group: { _id: null, totalBudget: { $sum: "$budget" }, totalAmount: { $sum: "$amount" } } },
    ]);

    const projectBudgetAgg = await Lead.aggregate([
      { $group: { _id: null, totalBudget: { $sum: "$budget" }, totalAmount: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      leads: {
        total: totalLeads,
        byStatus: leadStatusCounts,
        perMonth: leadsPerMonth,
        budget: leadBudgetAgg[0] || { totalBudget: 0, totalAmount: 0 },
      },
      projects: {
        total: totalProjects,
        byStatus: projectStatusCounts,
        perMonth: projectsPerMonth,
        budget: projectBudgetAgg[0] || { totalBudget: 0, totalAmount: 0 },
      },
    });
  }
  catch (err) {
    next(err);
  }
});

export default router;
