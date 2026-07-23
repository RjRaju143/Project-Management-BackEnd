/**
 * Script to create a user in the database.
 *
 * Usage:
 *   npm run create-user
 *
 * Edit the details below before running.
 */

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../src/models/user.js";

const SALT_ROUNDS = 12;

// ─── Hardcoded user details (edit these) ────────────────────────────────────
const USER_DATA = {
  firstName: "Admin",
  lastName: "User",
  username: "admin",
  email: "admin@gmail.com",
  password: "Admin@123",
  userType: "admin" as const, // "admin" or "user"
};
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // eslint-disable-next-line node/no-process-env
  const mongoUri = process.env.MONGODB_URI;
  console.log(`\nConnecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri!);
  console.log("Connected.\n");

  const existingEmail = await User.findOne({ email: USER_DATA.email.toLowerCase() });
  if (existingEmail) {
    console.log(`✓ User with email "${USER_DATA.email}" already exists. Skipping.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const existingUsername = await User.findOne({ username: USER_DATA.username.toLowerCase() });
  if (existingUsername) {
    console.log(`✓ User with username "${USER_DATA.username}" already exists. Skipping.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(USER_DATA.password, SALT_ROUNDS);

  const user = await User.create({
    firstName: USER_DATA.firstName.trim(),
    lastName: USER_DATA.lastName.trim(),
    username: USER_DATA.username.toLowerCase().trim(),
    email: USER_DATA.email.toLowerCase().trim(),
    hashedPassword,
    userType: USER_DATA.userType,
  });

  console.log("✓ User created successfully!\n");
  console.log(`  ID:       ${(user._id as { toString: () => string }).toString()}`);
  console.log(`  Name:     ${user.firstName} ${user.lastName}`);
  console.log(`  Username: ${user.username}`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Type:     ${user.userType}`);
  console.log(`  Password: ${USER_DATA.password}`);
  console.log("");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
