import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Токен авторизации не найден" },
      { status: 401 },
    );
  }

  if (!password) {
    return NextResponse.json(
      { message: "Пароль не предоставлен" },
      { status: 400 },
    );
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const fetchOptions: RequestInit & { agent?: object } = {
    method: "POST",
    body: JSON.stringify({ password }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  // In development, Node.js might reject self-signed certificates.
  if (process.versions?.node && process.env.NODE_ENV === "development") {
    const https = await import("node:https");
    fetchOptions.agent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  try {
    const apiResponse = await fetch(
      `${API_URL}/auth/validate-password`,
      fetchOptions,
    );
    if (apiResponse.ok) {
      return NextResponse.json({ message: "Пароль верный" }, { status: 200 });
    }

    // Handle specific error statuses from the external API
    switch (apiResponse.status) {
      case 400:
        return NextResponse.json(
          { message: "Неверный формат запроса к внешнему API" },
          { status: 400 },
        );
      case 401:
        return NextResponse.json(
          { message: "Неверный пароль" },
          { status: 401 },
        );
      default:
        return NextResponse.json(
          { message: "Внутренняя ошибка сервера при проверке пароля" },
          { status: apiResponse.status },
        );
    }
  } catch (error) {
    console.error("[API/AUTH/VALIDATE-PASSWORD] Fetch failed:", error);
    return NextResponse.json(
      { message: "Не удалось подключиться к сервису аутентификации" },
      { status: 503 }, // Service Unavailable
    );
  }
}
