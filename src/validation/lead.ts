import { z } from "zod/v4";
import { LEAD_STATUSES } from "../models/lead.js";

export const updateLeadSchema = z.object({
  clientName: z.string().min(1).max(200).trim(),
  organizationName: z.string().min(1).max(200).trim(),
  location: z.string().min(1).max(200).trim(),
  businessType: z.string().min(1).max(100).trim(),
  phone: z.string().min(1).max(30).trim(),
  pincode: z.string().min(1).max(10).trim(),
  budget: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
  status: z.enum(LEAD_STATUSES),
  timeline: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).optional(),
  statusChangeReason: z.string().max(500).optional(),
}).partial();

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
});
