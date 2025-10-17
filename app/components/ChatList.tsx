"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "../lib/serverActions";
import { useChatStore } from "../lib/store";
import { formaterDate } from "../lib/utils";
import type { Chat } from "../types";
import { LogPanel } from "./LogPanel";
import { useUser } from "./UserProvider";

export const ChatList = () => {
  const { chats, setActiveChatId, activeChatId } = useChatStore();
  const { userId } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };
  
  const getOtherParticipant = (chat: Chat) => {
    if (!userId) return null;
    return chat.participants.find((p) => p.user.id !== userId)?.user;
  };
  return (
    <div className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold">Чаты</h2>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white"
        >
          Выйти
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        {chats.length > 0 ? (
          chats.map((chat) => {
            const otherUser = getOtherParticipant(chat);
            const lastMessage = chat.messages?.[0];
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                className={`p-4 cursor-pointer border-b border-gray-700 ${isActive ? "bg-gray-600" : "hover:bg-gray-700"}`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="flex justify-between items-center">
                  <p className="font-bold">
                    {otherUser?.name || "Неизвестный"}
                  </p>
                  <p className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {lastMessage && formaterDate(lastMessage.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {lastMessage?.content || "Пока нет сообщений"}
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p>Нет доступных чатов.</p>
          </div>
        )}
      </div>
      <LogPanel />
    </div>
  );
};
