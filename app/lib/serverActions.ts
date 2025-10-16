"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { LoginDto, RegisterDto } from "../lib/api";
import { authApi } from "../lib/api";

const ACCESS_TOKEN_LIFETIME = 15 * 60 * 1000; // 15 минут
const REFRESH_TOKEN_EXPIRES_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 дней

export async function loginAction(dto: LoginDto) {
  try {
    const data = await authApi.login(dto);
    const cookieStore = await cookies();

    cookieStore.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCESS_TOKEN_LIFETIME / 1000,
      path: "/",
    });

    cookieStore.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_EXPIRES_DAYS / 1000,
      path: "/",
    });
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
    const loginData = await authApi.login({
      identifier: dto.phone,
      password: dto.password,
    });

    const cookieStore = await cookies();
    cookieStore.set("accessToken", loginData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCESS_TOKEN_LIFETIME / 1000,
      path: "/",
    });

    cookieStore.set("refreshToken", loginData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_EXPIRES_DAYS / 1000,
      path: "/",
    });
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
      maxAge: ACCESS_TOKEN_LIFETIME / 1000,
      path: "/",
    });
    return { success: true };
  } catch {
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    return { success: false };
  }
}
