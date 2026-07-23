import { z } from "zod/v4";
import { CLIENT_STATUSES } from "../models/client.js";

export const createClientSchema = z.object({
  clientName: z.string().max(200).trim().optional(),
  organizationName: z.string().max(200).trim().optional(),
  location: z.string().max(200).trim().optional(),
  businessType: z.string().max(100).trim().optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits").optional().or(z.literal("")),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits").optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional(),
  amount: z.coerce.number().min(0).optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
  timeline: z.string().max(100).trim().optional(),
  description: z.string().max(1000).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
});
