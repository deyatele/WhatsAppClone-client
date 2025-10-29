"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { LoginDto, RegisterDto } from "../lib/api";
import { authApi } from "../lib/api";

const ACCESS_TOKEN_LIFETIME_SEC =
  Number(process.env.ACCESS_TOKEN_LIFETIME_SEC) || 900; // 15 минут
const REFRESH_TOKEN_LIFETIME_SEC =
  Number(process.env.REFRESH_TOKEN_LIFETIME_SEC) || 604800; // 7 дней

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

    return {
      success: true,
    };
  } catch (error) {
    console.error("Login Action Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка входа",
    };
  }
}

export async function registerAction(dto: RegisterDto) {
  try {
    await authApi.register(dto);

    const loginData = await authApi.login({
      identifier: dto.phone,
      password: dto.password,
    });

    await _setAuthCookies(loginData.accessToken, loginData.refreshToken);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Register Action Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка регистрации",
    };
  }
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
