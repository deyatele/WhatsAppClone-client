"use client";

import type { Message as MessageType, PaginationState } from "../types";
import { Loader } from "./Loader";
import { Message } from "./Message";
import { useUser } from "./UserProvider";

interface MessageListProps {
  messages: MessageType[];
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  loaderRef: React.RefObject<HTMLDivElement | null>;
  pagination: PaginationState | undefined;
  activeChatId: string | null;
}

export const MessageList = ({
  messages,
  chatContainerRef,
  loaderRef,
  pagination,
}: MessageListProps) => {
  const { userId } = useUser();

  return (
    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
      <div ref={loaderRef}>{pagination?.isLoading && <Loader />}</div>
      <div className="space-y-2">
        {messages.map((msg) => {
          const isCurrentUser = msg.sender.id === userId;
          return (
            <Message key={msg.id} message={msg} isCurrentUser={isCurrentUser} />
          );
        })}
      </div>
    </div>
  );
};
