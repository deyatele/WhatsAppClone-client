"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { LoginDto, RegisterDto } from "../lib/api";
import { authApi } from "../lib/api";

// Используем переменные окружения для времени жизни токенов, приводя их к секундам
// Убедитесь, что эти переменные заданы в вашем .env файле
const ACCESS_TOKEN_LIFETIME_SEC =
  Number(process.env.ACCESS_TOKEN_LIFETIME_SEC) || 900; // 15 минут
const REFRESH_TOKEN_LIFETIME_SEC =
  Number(process.env.REFRESH_TOKEN_LIFETIME_SEC) || 604800; // 7 дней

/**
 * Устанавливает accessToken и refreshToken в httpOnly куки.
 * @param accessToken - Токен доступа
 * @param refreshToken - Токен обновления
 */
async function _setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_LIFETIME_SEC,
    path: "/",
  });

  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_LIFETIME_SEC,
    path: "/",
  });
}

export async function loginAction(dto: LoginDto) {
  try {
    const data = await authApi.login(dto);
    await _setAuthCookies(data.accessToken, data.refreshToken);
  } catch (error) {
    console.error("Login Action Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка входа",
    };
  }
  redirect("/");
}

export async function registerAction(dto: RegisterDto) {
  try {
    // 1. Сначала регистрируем пользователя
    await authApi.register(dto);

    // 2. Затем логиним его, чтобы получить токены
    const loginData = await authApi.login({
      identifier: dto.phone,
      password: dto.password,
    });

    // 3. Устанавливаем куки
    await _setAuthCookies(loginData.accessToken, loginData.refreshToken);
  } catch (error) {
    console.error("Register Action Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка регистрации",
    };
  }
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  redirect("/login");
}

export async function refreshAccessTokenAction(refreshToken: string) {
  const cookieStore = await cookies();

  try {
    const data = await authApi.refresh(refreshToken);
    cookieStore.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCESS_TOKEN_LIFETIME_SEC,
      path: "/",
    });
    return { success: true };
  } catch {
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    return { success: false };
  }
}
