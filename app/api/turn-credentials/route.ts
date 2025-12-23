import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken || !userId) {
    return new NextResponse("Unauthorized or User ID missing", { status: 401 });
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${API_URL}/turn-credentials/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log(accessToken)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch TURN credentials: ${response.statusText}`,
      );
    }

    const turnConfig = await response.json();
    return NextResponse.json(turnConfig);
  } catch (error) {
    console.error("[TURN API Route] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
