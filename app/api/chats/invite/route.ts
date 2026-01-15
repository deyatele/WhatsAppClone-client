import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json(
      { status: "error", message: "Токен авторизации не найден." },
      { status: 401 },
    );
  }

  try {
    const backendResponse = await fetch(`${API_URL}/chats/invite`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await backendResponse.json();
    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка при проксировании запроса на создание чата:", error);
    return NextResponse.json(
      { status: "error", message: "Внутренняя ошибка сервера." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { tokenId } = await request.json();
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json(
      { status: "error", message: "Токен авторизации не найден." },
      { status: 401 },
    );
  }

  try {
    const backendResponse = await fetch(`${API_URL}/chats/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: tokenId }),
    });
    const data = await backendResponse.json();
    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка при проксировании запроса на создание чата:", error);
    return NextResponse.json(
      { status: "error", message: "Внутренняя ошибка сервера." },
      { status: 500 },
    );
  }
}
