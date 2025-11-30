import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { log } from "../../../lib/log";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await fetch(`${API_URL}/users/me`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const res = await result.json();

    return NextResponse.json(res);
  } catch (e) {
    log(`ERROR: API /users/me error: ${e}`);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
