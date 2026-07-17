import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}
export const generateJwtToken = (
  payload: JwtPayload,
  secret: string,
): string => {
  try {
    const token: string = jwt.sign(payload, secret ,{
        expiresIn: "15d"
    });
    return token;
  } catch (error) {
    console.error("Failed to generate JWT token:", error);
    throw new Error("Failed to generate JWT token");
  }
};
