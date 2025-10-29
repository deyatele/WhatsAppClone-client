import { cookies } from "next/headers";
import { ZodError } from "zod";
import type { Chat } from "../types";
import { chatApi } from "./api";

export async function getChatsAndToken(): Promise<{
  chats: Chat[];
  token?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { chats: [], token: undefined };
  }

  try {
    const chats: Chat[] = await chatApi.getMyChats(token);
    return { chats, token };
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    if (error instanceof ZodError) {
      console.error("Zod validation issues:", error.issues);
    }
    return { chats: [], token };
  }
}
