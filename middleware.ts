import { type NextRequest, NextResponse } from "next/server";
import {
  getTokenFromRequest,
  refreshAccessToken,
  setAuthTokens,
} from "./app/lib/helpers/tokenHelper";
import { getUserIdFromToken } from "./app/lib/JWTVeriify";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isJoinChatRoute = pathname.startsWith("/join");

  let accessToken: string | null =
    getTokenFromRequest(request, "accessToken") || null;
  const refreshToken = getTokenFromRequest(request, "refreshToken");
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
    if (refreshToken) {
      const refreshResult = await refreshAccessToken(request);
      if (refreshResult instanceof NextResponse) {
        // Если refreshAccessToken вернул NextResponse (редирект), возвращаем его
        return refreshResult;
      }
      accessToken = refreshResult;

      if (!accessToken) {
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
    } else {
      // Если нет ни access, ни refresh токена
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
          `/${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
          request.url,
        ),
      );
    } else {
      const API_URL =
        process.env.NODE_ENV === "development"
          ? process.env.API_URL_DEV
          : process.env.API_URL_PROD;
      const result = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (result.status === 404) {
        const responce = NextResponse.redirect(
          new URL(
            `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
            request.url,
          ),
        );
        responce.cookies.delete("accessToken");
        responce.cookies.delete("refreshToken");
        return responce;
      }
    }

    const response = NextResponse.next();

    if (!request.cookies.has("accessToken") || !idUser) {
      // Получаем refresh токен для установки обоих токенов
      const refreshToken = getTokenFromRequest(request, "refreshToken");
      if (refreshToken) {
        setAuthTokens(response, accessToken, refreshToken);
      }
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Применяем ко всем путям, кроме служебных и файлов API и любых _next путей
    "/((?!api|_next|favicon.ico).*)",
  ],
};
