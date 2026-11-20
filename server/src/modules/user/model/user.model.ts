import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "owner" | "pharmacist" | "inventory_manager";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for Google OAuth
  role: UserRole;
  phone?: string | null;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
  };
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpiresAt?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
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

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
    },

    password: {
      type: String,
      required: function (this: IUser): boolean {
        return this.provider === "local";
      },
      select: false,
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

    emailVerified: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    refreshTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
      index: { sparse: true },
    },

    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
      index: { sparse: true },
    },

    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>("User", UserSchema);
