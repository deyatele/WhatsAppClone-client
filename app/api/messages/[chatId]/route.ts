import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { log } from "../../../lib/log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;

  const cookieStore = await cookies();
  let accessToken = cookieStore.get("accessToken")?.value;
  const inviteToken = request.nextUrl.searchParams.get("invite");

  if (!accessToken) {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (refreshToken) {
      try {
        const refreshUrl = new URL("/api/auth/refresh", request.url);
        const response = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            Cookie: `refreshToken=${refreshToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          accessToken = data?.accessToken || null;
          if (!accessToken)
            return NextResponse.redirect(
              new URL(
                `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
                request.url,
              ),
            );
        }
      } catch (e) {
        log(`ERROR: ${e}`);
        return NextResponse.redirect(
          new URL(
            `/login${typeof inviteToken === "string" ? `?invite=${inviteToken}` : ""}`,
            request.url,
          ),
        );
      }
    }
  }

  if (!chatId) {
    return new NextResponse("Не указан идентификатор чата.", { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = searchParams.get("limit") || "15";

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const url = new URL(`${API_URL}/messages/chat/${chatId}`);
    url.searchParams.append("limit", limit);
    if (cursor) {
      url.searchParams.append("cursor", cursor);
    }

    const response = await fetch(url.toString(), {
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

    const data = await response.json();

    const responseData = NextResponse.json(data);

    if (!request.cookies.has("accessToken") && accessToken) {
      const ACCESS_TOKEN_LIFETIME_SEC =
        Number(process.env.ACCESS_TOKEN_LIFETIME_SEC) || 900;
      responseData.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCESS_TOKEN_LIFETIME_SEC,
        path: "/",
      });
    }

    return responseData;
  } catch (error) {
    log(`ERROR: Не удалось получить сообщения.: ${error}`);
    return new NextResponse("Внутренняя ошибка сервера", { status: 500 });
  }
}
