export interface JWTUserPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  ver?: number;
}

declare global {
  // Express request augmentation requires a global namespace declaration.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JWTUserPayload | null;
    }
  }
}
