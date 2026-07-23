import type { Types } from "mongoose";
import type { LeadStatus } from "../models/lead.js";

export type LeadDocument = {
  _id: Types.ObjectId;
  companyName: string;
  companyType: string;
  phone: string;
  location: string;
  amount: number;
  status: LeadStatus;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateLeadInput = {
  companyName: string;
  companyType: string;
  phone: string;
  location: string;
  amount: number;
  status?: LeadStatus;
};

export type UpdateLeadInput = Partial<CreateLeadInput>;

export type LeadListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
};
