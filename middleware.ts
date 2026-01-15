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

  let accessToken: string | null =
    getTokenFromRequest(request, "accessToken") || null;
  const refreshToken = getTokenFromRequest(request, "refreshToken");
  const inviteToken = request.nextUrl.searchParams.get("invite");
  const idUser = await getUserIdFromToken(accessToken);

  if (!idUser) {
    accessToken = null;
  }

  if (!isAuthPage && accessToken && idUser) {
      // Если пользователь не на странице аутентификации и уже авторизован, пропускаем
      return NextResponse.next();
    }

  if (isAuthPage && accessToken && idUser) {
    // Если пользователь на странице аутентификации, но уже авторизован, редирект на главную
    return NextResponse.redirect(
      new URL(
        `/${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
        request.url,
      ),
    );
  }


  if (!isAuthPage && !accessToken && !refreshToken) {
    // Если пользователь не на странице аутентификации и нет токенов, редирект на логин
    return NextResponse.redirect(
      new URL(
        `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
        request.url,
      ),
    );
  }

  if (isAuthPage && !accessToken && !refreshToken) {
    // Если пользователь на странице аутентификации и нет токенов, пропускаем
    return NextResponse.next();
  }
  

  if (!isAuthPage && !accessToken && refreshToken) {
    // Если нет access токена, но есть refresh токен, пробуем обновить
    try {   
      const newAccessToken = await refreshAccessToken(refreshToken);

      if (newAccessToken) {
        accessToken = newAccessToken;
        const response = NextResponse.next();
        return setAuthTokens(response, accessToken, refreshToken);
      } else {
        // Если не удалось обновить токен, редирект на логин
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
    } catch {
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

  if (isAuthPage && !accessToken && refreshToken) {
    // Если пользователь на странице аутентификации, но нет access токена, но есть refresh токен, пробуем обновить
    try {
      const newAccessToken = await refreshAccessToken(refreshToken);

      if (newAccessToken) {
        accessToken = newAccessToken;
        const response = NextResponse.redirect(
          new URL(
            `/${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
            request.url,
          ),
        );
        setAuthTokens(response, accessToken, refreshToken);
        return response;
      } else return NextResponse.next();
    }
    catch {
      return NextResponse.next();
    }
  }
}

 export const config = {
  matcher: [
    // Применяем ко всем путям, кроме служебных и файлов API и любых _next путей
    "/((?!api|_next|favicon.ico).*)",
  ],
}; 
