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
export async function refreshAccessToken(request: NextRequest) {
  const refreshToken = getTokenFromRequest(request, "refreshToken");
  const inviteToken = request.nextUrl.searchParams.get("invite");

  if (!refreshToken) {
    return NextResponse.redirect(
      new URL(
        `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
        request.url,
      ),
    );
  }

  try {
    const refreshUrl = new URL("/api/auth/refresh", request.url);
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
    return NextResponse.redirect(
      new URL(
        `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
        request.url,
      ),
    );
  }

  return null;
}

/**
 * Получить токен, при необходимости обновив его
 */
export async function getValidToken(request: NextRequest) {
  let accessToken = getTokenFromRequest(request, "accessToken");
  const inviteToken = request.nextUrl.searchParams.get("invite");

  if (!accessToken) {
    const newAccessToken = await refreshAccessToken(request);

    if (newAccessToken && typeof newAccessToken !== "string") {
      // Если refreshAccessToken вернул NextResponse, возвращаем его
      return newAccessToken;
    }

    accessToken = newAccessToken;

    if (!accessToken) {
      return NextResponse.redirect(
        new URL(
          `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
          request.url,
        ),
      );
    }
  }

  return accessToken;
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
