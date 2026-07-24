import crypto from "node:crypto";
import mongoose from "mongoose";
import type { UserType } from "./user.js";

const inviteSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    userType: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accepted: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

inviteSchema.index({ token: 1 });
inviteSchema.index({ email: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Generate a secure random token for invites
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const Invite = mongoose.model("Invite", inviteSchema);

export default Invite;
export type { UserType };
