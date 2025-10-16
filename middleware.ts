import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Если пользователь авторизован, но пытается зайти на страницу входа/регистрации,
  // перенаправляем его на главную.
  if (accessToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Если пользователь НЕ авторизован и пытается зайти НЕ на страницу входа/регистрации,
  // перенаправляем его на страницу входа.
  if (!accessToken && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Во всех остальных случаях разрешаем переход.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Применяем ко всем путям, кроме служебных и файлов API
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
