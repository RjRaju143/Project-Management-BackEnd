import { z } from "zod/v4";
import { USER_TYPES } from "../models/user.js";

export const loginSchema = z.object({
  email: z.email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const inviteUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  username: z.string().min(3, "Username must be at least 3 characters").max(30).trim().toLowerCase(),
  email: z.email("Please provide a valid email address"),
  userType: z.enum(USER_TYPES).default("user"),
});

export type InviteUserSchemaType = z.infer<typeof inviteUserSchema>;

export const registerSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
