import bcrypt from "bcryptjs";
import type { Request } from "express";

import User from "../models/user.js";

export type LoginInput = {
  email: string;
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
