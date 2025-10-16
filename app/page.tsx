import { cookies } from "next/headers";
import { ZodError } from "zod"; // Import ZodError

import { ChatList } from "./components/ChatList";
import { ChatWindow } from "./components/ChatWindow";
import StoreInitializer from "./components/StoreInitializer";
import type { Chat } from "./lib/api";
import { chatApi } from "./lib/api";

async function getChats(): Promise<Chat[]> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return [];
  }

  try {
    const chats: Chat[] = await chatApi.getMyChats(accessToken);
    return chats;
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    if (error instanceof ZodError) {
      console.error("Zod validation issues:", error.issues);
    }
    return [];
  }
}

export default async function Home() {
  const chats = await getChats();

  return (
    <main className="flex h-screen">
      <StoreInitializer chats={chats} />
      <div className="w-1/3">
        <ChatList />
      </div>
      <div className="w-2/3">
        <ChatWindow />
      </div>
    </main>
  );
}