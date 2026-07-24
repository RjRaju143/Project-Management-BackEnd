import Activity from "../models/activity.js";
import type { ActivityAction, ActivityEntity } from "../models/activity.js";

export type LogActivityInput = {
  userId: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string;
  entityName: string;
  changes?: Record<string, unknown> | null;
};

export async function logActivity(input: LogActivityInput) {
  await Activity.create({
    user: input.userId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    entityName: input.entityName,
    changes: input.changes || null,
  });
}

export type ActivityListQuery = {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
};

export async function getActivities(query: ActivityListQuery) {
  const { page = 1, limit = 30, entity, action } = query;

  const filter: Record<string, unknown> = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate("user", "firstName lastName username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filter),
  ]);

  return {
    activities,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
