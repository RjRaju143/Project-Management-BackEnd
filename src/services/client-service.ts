import type { ClientStatus } from "../models/client.js";
import Client from "../models/client.js";

export type CreateClientInput = {
  clientName?: string;
  organizationName?: string;
  location?: string;
  businessType?: string;
  phone?: string;
  pincode?: string;
  budget?: number;
  amount?: number;
  status?: ClientStatus;
  timeline?: string;
  description?: string;
  followedUp?: boolean;
};

export type UpdateClientInput = Partial<CreateClientInput>;

export type ClientListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export async function createClient(input: CreateClientInput, userId: string) {
  const client = await Client.create({ ...input, user: userId });
  return client.populate("user", "firstName lastName username");
}

export async function getClients(query: ClientListQuery) {
  const { page = 1, limit = 20, search, status } = query;

  const filter: Record<string, unknown> = {};

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

  const [clients, total] = await Promise.all([
    Client.find(filter)
      .populate("user", "firstName lastName username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Client.countDocuments(filter),
  ]);

  return {
    clients,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClientById(id: string) {
  const client = await Client.findById(id).populate("user", "firstName lastName username");
  if (!client) {
    const err = new Error("Client not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const existing = await Client.findById(id);
  if (!existing) {
    const err = new Error("Client not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
  if (existing.status === "Started" && input.status && input.status !== "Started") {
    const err = new Error("Cannot change status of a started client");
    (err as NodeJS.ErrnoException).code = "STATUS_LOCKED";
    throw err;
  }

  const client = await Client.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true },
  ).populate("user", "firstName lastName username");

  if (!client) {
    const err = new Error("Client not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
  return client;
}

export async function deleteClient(id: string) {
  const client = await Client.findByIdAndDelete(id);
  if (!client) {
    const err = new Error("Client not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
}
