import mongoose from "mongoose";

export const ACTIVITY_ACTIONS = ["created", "updated", "deleted", "followed_up"] as const;
export type ActivityAction = typeof ACTIVITY_ACTIONS[number];

export const ACTIVITY_ENTITIES = ["lead", "project"] as const;
export type ActivityEntity = typeof ACTIVITY_ENTITIES[number];

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ACTIVITY_ACTIONS,
      required: true,
    },
    entity: {
      type: String,
      enum: ACTIVITY_ENTITIES,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityName: {
      type: String,
      trim: true,
      default: "",
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1 });
activitySchema.index({ entity: 1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
