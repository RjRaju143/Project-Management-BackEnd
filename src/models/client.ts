import mongoose from "mongoose";

export const CLIENT_STATUSES = ["Inactive", "Active", "Proposed", "On Hold", "Started", "Closed"] as const;
export type ClientStatus = typeof CLIENT_STATUSES[number];

const clientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    organizationName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    businessType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      maxlength: 10,
      default: "",
    },
    budget: {
      type: Number,
      min: 0,
      default: 0,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: CLIENT_STATUSES,
      default: "Proposed",
    },
    timeline: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    followedUp: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

clientSchema.index({ status: 1 });
clientSchema.index({ user: 1 });
clientSchema.index({ createdAt: -1 });

const Client = mongoose.model("Client", clientSchema);

export default Client;
