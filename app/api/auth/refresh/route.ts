import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authApi } from "../../../lib/api";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { message: "Refresh token not found" },
      { status: 401 },
    );
  }

  try {
    const { accessToken } = await authApi.refresh(refreshToken);
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("[API/AUTH/REFRESH] Failed:", error);
    const response = NextResponse.json(
      { message: "Invalid refresh token" },
      { status: 403 },
    );
    response.cookies.delete("refreshToken");
    response.cookies.delete("accessToken");
    return response;
  }
}
