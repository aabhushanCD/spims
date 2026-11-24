import mongoose, { Document, Schema } from "mongoose";

import {
  CALENDAR_MODES,
  DEFAULT_USER_PREFERENCES,
  LANGUAGES,
  type CalendarMode,
  type Language,
} from "../types/preferences.ts";

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
  preferences: {
    language: Language;
    calendarMode: CalendarMode;
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
  tokenVersion: number;
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

    preferences: {
      language: {
        type: String,
        enum: LANGUAGES,
        default: DEFAULT_USER_PREFERENCES.language,
      },
      calendarMode: {
        type: String,
        enum: CALENDAR_MODES,
        default: DEFAULT_USER_PREFERENCES.calendarMode,
      },
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

    // Included in access tokens so a role change, password reset, or admin
    // force-logout can invalidate every access token before its TTL expires.
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>("User", UserSchema);
