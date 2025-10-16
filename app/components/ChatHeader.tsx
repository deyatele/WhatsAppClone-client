
'use client';

import type { User } from "../lib/api";
import type { Message } from "../lib/store";
import { formatTimestamp } from "../lib/utils";

interface ChatHeaderProps {
  otherUser: User | undefined;
  lastMessage: Message | undefined;
}

export const ChatHeader = ({ otherUser, lastMessage }: ChatHeaderProps) => {
  return (
    <div className="p-3 border-b border-gray-700 bg-gray-800 flex items-center">
      <div>
        <h2 className="text-xl font-bold text-white">{otherUser?.name || "Чат"}</h2>
        {lastMessage && (
          <p className="text-xs text-gray-400">
            был(-а) в {formatTimestamp(lastMessage.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
};
