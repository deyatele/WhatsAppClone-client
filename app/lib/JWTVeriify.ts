import { jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error("JWT_SECRET is not set in environment variables.");
  throw new Error("JWT_SECRET is not configured.");
}
const secretKey = new TextEncoder().encode(secret);


export async function getUserIdFromToken(
  token: string | null | undefined,
): Promise<string | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload.sub || null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}
