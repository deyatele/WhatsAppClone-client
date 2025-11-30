import { cookies } from "next/headers";
import { ZodError } from "zod";
import type { ChatResponse } from "../types";
import { chatApi } from "./api";
import { getUserIdFromToken } from "./JWTVeriify";

export async function getChatsAndToken(): Promise<{
  chats: ChatResponse[];
  token?: string;
  userId?: string | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const userId = await getUserIdFromToken(token);

  if (!token) {
    return { chats: [], token: undefined };
  }

  try {
    const chats = await chatApi.getMyChats(token);
    return { chats, userId };
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    if (error instanceof ZodError) {
      console.error("Zod validation issues:", error.issues);
    }
    return { chats: [], token, userId };
  }
}
