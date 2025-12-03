"use client";

import { memo } from "react";
import { useDateFormatter } from "../../lib/hooks/useDateFormatter";
import type { Chat } from "../../types";
import { UserAvatar } from "../ui/UserAvatar";

interface ChatItemProps {
  chat: Chat;
  userId: string | null;
  activeChatId: string | null;
  handleChatClick: (chatId: string) => void;
}

export const ChatItem = memo(
  ({ chat, userId, activeChatId, handleChatClick }: ChatItemProps) => {
    const { format } = useDateFormatter();
    const getOtherParticipant = (chat: Chat) => {
      if (!userId || !chat.participants) return null;
      return chat.participants.find((p) => p.user.id !== userId)?.user;
    };

    const otherUser = getOtherParticipant(chat);
    const lastMessage = chat.messages?.[0];
    const isActive = chat.id === activeChatId;

    return (
      <div
        key={chat.id}
        className={`p-4 border-b border-gray-700 ${
          isActive ? "bg-gray-600" : "cursor-pointer hover:bg-gray-700"
        }`}
        onClick={() => handleChatClick(chat.id)}
      >
        <div className="flex gap-3 items-center">
          <div className="flex-none">
            <UserAvatar user={otherUser} size="md" />
          </div>
          <div className="flex flex-col mb-1 w-full min-w-0">
            <div className="flex justify-between items-center">
              <p className="font-bold truncate">
                {otherUser?.name || "Неизвестный"}
              </p>
              <p className="text-sm text-gray-400 whitespace-nowrap ml-2">
                {lastMessage && format(lastMessage.createdAt)}
              </p>
            </div>
            <div className="flex justify-between items-center min-w-0">
              <p
                className="text-sm text-gray-400 truncate"
                title={lastMessage?.message}
              >
                {lastMessage?.message || "Пока нет сообщений"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
