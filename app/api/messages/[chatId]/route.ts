import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Этот маршрут действует как прокси к основному бэкенду,
// используя httpOnly cookie для аутентификации.
export async function GET(
  _: Request,
  { params }: { params: { chatId: string } },
) {
  const { chatId } = await params;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!chatId) {
    return new NextResponse("Chat ID is required", { status: 400 });
  }

  try {
    // Мы не можем напрямую вызвать chatApi.getMessages, так как он требует токен как аргумент,
    // а нам нужен fetch с уже встроенными куки. Поэтому мы делаем прямой fetch.
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${API_URL}/messages/chat/${chatId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new NextResponse(JSON.stringify(errorData), {
        status: response.status,
      });
    }

    const messages = await response.json();
    return NextResponse.json(messages);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
