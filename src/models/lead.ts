import mongoose from "mongoose";

export const LEAD_STATUSES = ["Pending", "Started", "On Hold", "Completed", "Closed"] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

const leadSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    businessType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "Pending",
      required: true,
    },
    timeline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    statusChangeReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
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

leadSchema.index({ status: 1 });
leadSchema.index({ user: 1 });
leadSchema.index({ createdAt: -1 });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
