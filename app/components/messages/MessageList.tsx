"use client";

import { useEffect } from "react";
import { useChatStore } from "../../lib/store";
import type { Message as MessageType } from "../../types";
import { Loader, LoaderSize } from "../ui/Loader";
import { Message } from "./Message";

interface MessageListProps {
  messages: MessageType[];
  chatContainerRef: (node: HTMLDivElement | null) => void;
  loaderRef: (node: HTMLDivElement | null) => void;
  activeChatId: string | null;
  userId: string | null;
  handleDeleteMessage: (id: string, flag?: boolean) => void;
  chatContainer: HTMLDivElement | null;
}

export const MessageList = ({
  messages,
  chatContainerRef,
  loaderRef,
  userId,
  handleDeleteMessage,
  activeChatId,
  chatContainer,
}: MessageListProps) => {
  const isLoadingMore =
    useChatStore((state) => state.pagination[activeChatId || ""]?.isLoading) ||
    false;
  useEffect(() => {
    if (!chatContainer || messages.length === 0) return;
  }, [messages, chatContainer]);

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 p-4 overflow-y-auto flex flex-col-reverse"
    >
      <div className="space-y-4">
        {isLoadingMore && (
          <div>
            <Loader size={LoaderSize.xl} />
          </div>
        )}
        {messages.map((msg) => {
          const isCurrentUser = msg.sender.id === userId;
          return (
            <Message
              key={msg.id}
              message={msg}
              isCurrentUser={isCurrentUser}
              handleDeleteMessage={handleDeleteMessage}
            />
          );
        })}
      </div>
      <div ref={loaderRef} className="invisible"></div>
    </div>
  );
};
