import mongoose, { Document, Schema } from "mongoose";

export interface IAuthSession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  previousRefreshTokenHash: string | null;
  previousRefreshTokenExpiresAt: Date | null;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  userAgent: string;
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AuthSessionSchema = new Schema<IAuthSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
    },

    // Short grace window so two browser tabs rotating the same token do not
    // revoke each other's session.
    previousRefreshTokenHash: {
      type: String,
      default: null,
    },

    previousRefreshTokenExpiresAt: {
      type: Date,
      default: null,
    },

    device: {
      type: String,
      default: "Unknown device",
    },

    browser: {
      type: String,
      default: "Unknown browser",
    },

    os: {
      type: String,
      default: "Unknown OS",
    },

    ip: {
      type: String,
      default: "Unknown",
    },

    location: {
      type: String,
      default: "Unknown",
    },

    userAgent: {
      type: String,
      default: "",
    },

    expiresAt: {
      type: Date,
      required: true,
      // MongoDB removes the document automatically once the session expires.
      expires: 0,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const AuthSession = mongoose.model<IAuthSession>(
  "AuthSession",
  AuthSessionSchema,
);

export default AuthSession;
