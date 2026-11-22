import type { JWTUserPayload } from "../../types/global.ts";
import { verifyAccessToken } from "../../modules/auth/utils/authTokens.ts";

export const verifyJwt = (token: string): JWTUserPayload => {
  const payload = verifyAccessToken(token);

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
    ...(typeof payload.ver === "number" ? { ver: payload.ver } : {}),
  };
};
