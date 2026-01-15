import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { log } from "../log";

/**
 * Получить токен из cookies (для серверных компонентов)
 */
export async function getTokenFromCookies(tokenName: string = "accessToken") {
  const cookieStore = await cookies();
  return cookieStore.get(tokenName)?.value;
}

/**
 * Получить токен из NextRequest (для middleware)
 */
export function getTokenFromRequest(
  request: NextRequest,
  tokenName: string = "accessToken",
) {
  return request.cookies.get(tokenName)?.value;
}

/**
 * Обновить access токен, используя refresh токен
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> { 
  try {
    const refreshUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/refresh`);
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data?.accessToken || null;
    }
  } catch (e) {
    log(`ERROR: ${e}`);
    return null;
  }

  return null;
}


/**
 * Установить токены в cookies
 */
export function setAuthTokens(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  const ACCESS_TOKEN_LIFETIME_SEC =
    Number(process.env.ACCESS_TOKEN_LIFETIME_SEC) || 900;

  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_LIFETIME_SEC,
    path: "/",
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: Number(process.env.REFRESH_TOKEN_LIFETIME_SEC) || 604800, // 7 дней
    path: "/",
  });

  return response;
}
