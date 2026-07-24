import bcrypt from "bcryptjs";
import type { Request } from "express";

import Invite, { generateInviteToken } from "../models/invite.js";
import type { UserType } from "../models/user.js";
import User from "../models/user.js";
import { env } from "../config/env.js";
import { isSmtpConfigured, sendInviteEmail } from "./mail-service.js";

const SALT_ROUNDS = 12;
const INVITE_EXPIRY_DAYS = 7;

export type LoginInput = {
  email: string;
  password: string;
};

export type InviteUserInput = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  userType?: UserType;
};

export type RegisterInput = {
  token: string;
  password: string;
};

export type LoginResult = {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    userType: string;
  };
};

export async function loginUser(input: LoginInput, req: Request): Promise<LoginResult> {
  const { email, password } = input;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const err = new Error("Invalid email or password");
    (err as NodeJS.ErrnoException).code = "INVALID_CREDENTIALS";
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    (err as NodeJS.ErrnoException).code = "INVALID_CREDENTIALS";
    throw err;
  }

  const userId = (user._id as { toString: () => string }).toString();
  req.session.userId = userId;
  req.session.email = user.email;
  req.session.username = user.username;
  req.session.userType = user.userType;

  return {
    message: "Login successful",
    user: {
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      userType: user.userType,
    },
  };
}

export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found");
    (err as NodeJS.ErrnoException).code = "NOT_FOUND";
    throw err;
  }
  return user;
}

/**
 * Create a pending invite. Generates a token and logs the invite link to console.
 */
export async function inviteUser(input: InviteUserInput, invitedById: string) {
  const { firstName, lastName, username, email, userType = "user" } = input;

  // Check for duplicate email (existing user)
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    const err = new Error("A user with this email already exists");
    (err as NodeJS.ErrnoException).code = "DUPLICATE_EMAIL";
    throw err;
  }

  // Check for duplicate username (existing user)
  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    const err = new Error("A user with this username already exists");
    (err as NodeJS.ErrnoException).code = "DUPLICATE_USERNAME";
    throw err;
  }

  // Check for existing pending invite with same email
  const existingInvite = await Invite.findOne({ email: email.toLowerCase(), accepted: false });
  if (existingInvite) {
    // Remove old invite and create a new one
    await existingInvite.deleteOne();
  }

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invite = await Invite.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    userType,
    token,
    invitedBy: invitedById,
    expiresAt,
  });

  // Build invite link
  const frontendUrl = env.FRONTEND_URL;
  const inviteLink = `${frontendUrl}/register/${token}`;

  // Send invite email if SMTP is configured
  if (isSmtpConfigured()) {
    try {
      await sendInviteEmail({
        to: email.toLowerCase(),
        firstName: firstName.trim(),
        inviteLink,
      });
      // eslint-disable-next-line no-console
      console.log(`📧 Invite email sent to: ${email}`);
    }
    catch (emailErr) {
      // eslint-disable-next-line no-console
      console.error("Failed to send invite email:", emailErr);
    }
  }

  // Always log to console as fallback
  // eslint-disable-next-line no-console
  console.log("\n" + "=".repeat(60));
  // eslint-disable-next-line no-console
  console.log("📧 INVITE LINK (share manually if email not received)");
  // eslint-disable-next-line no-console
  console.log("=".repeat(60));
  // eslint-disable-next-line no-console
  console.log(`  Name:     ${firstName} ${lastName}`);
  // eslint-disable-next-line no-console
  console.log(`  Email:    ${email}`);
  // eslint-disable-next-line no-console
  console.log(`  Username: ${username}`);
  // eslint-disable-next-line no-console
  console.log(`  Role:     ${userType}`);
  // eslint-disable-next-line no-console
  console.log(`  Link:     ${inviteLink}`);
  // eslint-disable-next-line no-console
  console.log(`  Expires:  ${expiresAt.toISOString()}`);
  // eslint-disable-next-line no-console
  console.log("=".repeat(60) + "\n");

  return { invite, inviteLink };
}

/**
 * Validate an invite token — returns the invite details if valid.
 */
export async function getInviteByToken(token: string) {
  const invite = await Invite.findOne({ token, accepted: false });

  if (!invite) {
    const err = new Error("Invalid or expired invite link");
    (err as NodeJS.ErrnoException).code = "INVITE_INVALID";
    throw err;
  }

  if (invite.expiresAt < new Date()) {
    const err = new Error("This invite link has expired");
    (err as NodeJS.ErrnoException).code = "INVITE_EXPIRED";
    throw err;
  }

  return invite;
}

/**
 * Get all invites created by a specific admin user.
 */
export async function getInvitesByUser(userId: string) {
  const invites = await Invite.find({ invitedBy: userId })
    .sort({ createdAt: -1 })
    .lean();
  return invites;
}

/**
 * Accept an invite — user sets their password and their account is created.
 */
export async function registerWithInvite(input: RegisterInput) {
  const { token, password } = input;

  const invite = await getInviteByToken(token);

  // Double-check no user was created in the meantime
  const existingEmail = await User.findOne({ email: invite.email });
  if (existingEmail) {
    const err = new Error("A user with this email already exists");
    (err as NodeJS.ErrnoException).code = "DUPLICATE_EMAIL";
    throw err;
  }

  const existingUsername = await User.findOne({ username: invite.username });
  if (existingUsername) {
    const err = new Error("A user with this username already exists");
    (err as NodeJS.ErrnoException).code = "DUPLICATE_USERNAME";
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    firstName: invite.firstName,
    lastName: invite.lastName,
    username: invite.username,
    email: invite.email,
    hashedPassword,
    userType: invite.userType,
  });

  // Mark invite as accepted
  invite.accepted = true;
  await invite.save();

  return user;
}
