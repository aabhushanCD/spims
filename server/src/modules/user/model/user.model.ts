import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "owner" | "pharmacist" | "inventory_manager";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for Google OAuth
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  refreshToken?: string | null;
  provider: "local" | "google";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    role: {
      type: String,
      enum: ["owner", "pharmacist", "inventory_manager"],
      default: "pharmacist",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>("User", UserSchema);
