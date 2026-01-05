import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.NODE_ENV === "development"
    ? process.env.API_URL_DEV
    : process.env.API_URL_PROD;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json(
      { status: "error", message: "Токен авторизации не найден." },
      { status: 401 },
    );
  }

  try {
    // Получаем тело запроса от клиента
    const body = await req.json();
    if (!body.ovnerUserId) return NextResponse.json(null);

    const backendResponse = await fetch(`${API_URL}/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // Передаем полученное тело на удаленный бэкенд
      body: JSON.stringify({
        userId: body.ovnerUserId,
        inviteToken: body.inviteToken,
      }),
    });

    const data = await backendResponse.json();
    if (data.error)
      return NextResponse.json(
        { status: data.error, message: data.message },
        { status: data.statusCode },
      );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка при проксировании запроса на создание чата:", error);
    return NextResponse.json(
      { status: "error", message: "Внутренняя ошибка сервера." },
      { status: 500 },
    );
  }
}
