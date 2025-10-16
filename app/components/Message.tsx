"use client";

import type { Message as MessageType } from "../lib/api";

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
}

export const Message = ({ message, isCurrentUser }: MessageProps) => {
  return (
    <div
      key={message.id}
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`p-3 rounded-lg max-w-md ${isCurrentUser ? "bg-green-800" : "bg-gray-700"} text-white`}
      >
        {!isCurrentUser && (
          <p className="text-sm font-bold text-green-400">
            {message.sender?.name || "User"}
          </p>
        )}
        <p className="break-words">{message.content}</p>
        <p className="text-xs text-right text-gray-400 mt-1">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};
