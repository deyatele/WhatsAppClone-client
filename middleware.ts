import { type NextRequest, NextResponse } from "next/server";
import { getUserIdFromToken } from "./app/lib/JWTVeriify";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isJoinChatRoute = pathname.startsWith("/join");

  let accessToken: string | null | undefined =
    request.cookies.get("accessToken")?.value;
  const inviteToken = request.nextUrl.searchParams.get("invite");
  const idUser = await getUserIdFromToken(accessToken);
  if (!idUser) {
    accessToken = null;
  }

  // Обработка пригласительной ссылки
  if (isJoinChatRoute && inviteToken) {
    if (!accessToken) {
      return NextResponse.redirect(
        new URL(
          `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
          request.url,
        ),
      );
    }
    return NextResponse.redirect(
      new URL(
        `/${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
        request.url,
      ),
    );
  }

  if (!accessToken) {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (refreshToken) {
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
          accessToken = data?.accessToken || null;
          if (!accessToken)
            return NextResponse.redirect(
              new URL(
                `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
                request.url,
              ),
            );
        }
      } catch (e) {
        console.log(e);
        return NextResponse.redirect(
          new URL(
            `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
            request.url,
          ),
        );
      }
    } else {
      if (!isAuthPage) {
        return NextResponse.redirect(
          new URL(
            `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
            request.url,
          ),
        );
      }
      return NextResponse.next();
    }
  }

  if (accessToken) {
    if (isAuthPage) {
      return NextResponse.redirect(
        new URL(
          `/${typeof inviteToken === "string" && `?invite=${inviteToken}`}`,
          request.url,
        ),
      );
    }

    const response = NextResponse.next();

    if (!request.cookies.has("accessToken") || !idUser) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Применяем ко всем путям, кроме служебных и файлов API
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
