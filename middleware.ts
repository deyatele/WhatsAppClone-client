import { type NextRequest, NextResponse } from "next/server";

async function attemptRefresh(request: NextRequest): Promise<string | null> {
  const refreshToken = request.cookies.get("refreshToken")?.value;
  if (!refreshToken) return null;

  try {
    const refreshUrl = new URL("/api/auth/refresh", request.url);
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.accessToken || null;
  } catch (error) {
    console.error("[Middleware] Refresh request failed:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  let accessToken: string | null | undefined =
    request.cookies.get("accessToken")?.value;

  if (!accessToken) {
    accessToken = await attemptRefresh(request);
  }

  if (accessToken) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const response = NextResponse.next();

    if (!request.cookies.has("accessToken")) {
      const ACCESS_TOKEN_LIFETIME_SEC =
        Number(process.env.ACCESS_TOKEN_LIFETIME_SEC) || 900;
      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCESS_TOKEN_LIFETIME_SEC,
        path: "/",
      });
    }

    return response;
  }

  if (!isAuthPage) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Применяем ко всем путям, кроме служебных и файлов API
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
