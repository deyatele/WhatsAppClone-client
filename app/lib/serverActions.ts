"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { LoginDto, RegisterDto } from "../lib/api";
import { authApi } from "../lib/api";
import type { User } from "../types";
import type { JsonWebKeys } from "./crypto/types/keys.types";

const ACCESS_TOKEN_LIFETIME_SEC =
  Number(process.env.ACCESS_TOKEN_LIFETIME_SEC) || 900; // 15 минут
const REFRESH_TOKEN_LIFETIME_SEC =
  Number(process.env.REFRESH_TOKEN_LIFETIME_SEC) || 604800; // 7 дней

export async function setAuthCookies(
  accessToken: string | undefined,
  refreshToken: string | undefined,
) {
  if (!accessToken || !refreshToken) return;
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
    await setAuthCookies(data.accessToken, data.refreshToken);
    return {
      success: true,
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function registerAction(
  dto: RegisterDto,
): Promise<
  ({ success: boolean } & User) | { success: boolean; error: string }
> {
  try {
    await authApi.register(dto);

    const loginData = await authApi.login({
      identifier: dto.phone,
      password: dto.password,
    });
    const { accessToken, refreshToken, user } = loginData;

    await setAuthCookies(accessToken, refreshToken);
    return { success: true, ...user };
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

export async function fetchPrivateKeyBackupAction(accessToken?: string) {
  if (!accessToken) {
    const cookieStore = await cookies();
    accessToken = cookieStore.get("accessToken")?.value;
  }

  if (!accessToken) return null;

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const targetUrl = `${API_URL}/users/me/privateKeyBackup`;

    const res = await fetch(targetUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) {
      return null;
    }
    if (!res.ok) {
      return { serverUnavailable: true } as const;
    }
    const json = await res.json();
    return json;
  } catch (e) {
    console.error(e);
    return { serverUnavailable: true } as const;
  }
}

/**
 * Серверный action: обновления ключей текущего пользователя
 */
export async function updateMyKeys(
  keyPair: JsonWebKeys,
  token: string,
  id: string,
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const targetUrl = `${API_URL}/users/${id}/keys`;
  try {
    const res = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(keyPair),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `HTTP error! status: ${res.status}, message: ${errorText}`,
      );
    }

    return { success: true } as const;
  } catch (e) {
    console.error("updateMyPublicKeyDirect error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      serverUnavailable: true,
    };
  }
}

import { getChatsAndToken } from "./getChats";

export async function getChatsAction() {
  const { chats, userId } = await getChatsAndToken();
  return { chats, userId };
}
