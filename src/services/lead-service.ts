import type { LeadStatus } from "../models/lead.js";
import Lead from "../models/lead.js";

export type CreateLeadInput = {
  clientName: string;
  organizationName: string;
  location: string;
  businessType: string;
  phone: string;
  pincode: string;
  budget: number;
  amount: number;
  status?: LeadStatus;
  timeline: string;
  description?: string;
};

export type UpdateLeadInput = Partial<CreateLeadInput> & {
  statusChangeReason?: string;
  startedAt?: string;
  completedAt?: string;
};

export type LeadListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export async function createLead(input: CreateLeadInput, userId: string) {
  const lead = await Lead.create({ ...input, user: userId });
  return lead.populate("user", "firstName lastName username");
}

export async function getLeads(query: LeadListQuery, userId: string) {
  const { page = 1, limit = 20, search, status } = query;

  const filter: Record<string, unknown> = { user: userId };

  if (status) {
    filter.status = status;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { clientName: regex },
      { organizationName: regex },
      { location: regex },
      { phone: regex },
      { businessType: regex },
    ];
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("user", "firstName lastName username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  return {
    leads,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getLeadById(id: string, userId: string) {
  const lead = await Lead.findOne({ _id: id, user: userId }).populate("user", "firstName lastName username");
  if (!lead) {
    const err = new Error("Lead not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
  return lead;
}

export async function updateLead(id: string, input: UpdateLeadInput, userId: string) {
  // Check if lead is locked (status = Completed)
  const existing = await Lead.findOne({ _id: id, user: userId });
  if (!existing) {
    const err = new Error("Lead not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
  if (existing.status === "Completed" && input.status && input.status !== "Completed") {
    if (!input.statusChangeReason || !input.statusChangeReason.trim()) {
      const err = new Error("A reason is required to change status from Completed");
      (err as NodeJS.ErrnoException).code = "REASON_REQUIRED";
      throw err;
    }
  }

  // Auto-set startedAt / completedAt based on status changes
  if (input.status === "Started" && existing.status !== "Started") {
    input.startedAt = new Date().toISOString();
  }
  if (input.status === "Completed" && existing.status !== "Completed") {
    input.completedAt = new Date().toISOString();
  }

  const lead = await Lead.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: input },
    { new: true, runValidators: true },
  ).populate("user", "firstName lastName username");

  if (!lead) {
    const err = new Error("Lead not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
  return lead;
}

export async function deleteLead(id: string, userId: string) {
  const lead = await Lead.findOneAndDelete({ _id: id, user: userId });
  if (!lead) {
    const err = new Error("Lead not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
}
