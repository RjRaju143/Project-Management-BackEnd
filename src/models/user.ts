import mongoose from "mongoose";

export const USER_TYPES = ["admin", "user"] as const;
export type UserType = typeof USER_TYPES[number];

const userSchema = new mongoose.Schema(
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
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: USER_TYPES,
      default: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete ret.hashedPassword;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
