"use client";

import { useChat } from "../../lib/hooks/useChat";
import { useChatStore } from "../../lib/store";
import { MessageInput } from "../messages/MessageInput";
import { MessageList } from "../messages/MessageList";
import { useUser } from "../providers/UserProvider";
import { Loader } from "../ui/Loader";
import { Welcome } from "../ui/Welcome";
import { ChatHeader } from "./ChatHeader";

export const ChatWindow = () => {
  const {
    activeChatId,
    otherUser,
    activeChatMessages,
    chatContainerRef,
    loaderRef,
    handleSendMessage,
    handleDeleteMessage,
    chatContainer,
  } = useChat();
  const { userId } = useUser();
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  if (!activeChatId) {
    return <Welcome />;
  }

  const lastMessage = activeChatMessages[activeChatMessages.length - 1];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <ChatHeader otherUser={otherUser} lastMessage={lastMessage} />
      {isLoadingMessages ? (
        <div className="h-full">
          <div className="pt-16">
            <Loader size={24} />
          </div>
        </div>
      ) : (
        <MessageList
          messages={activeChatMessages}
          chatContainerRef={chatContainerRef}
          loaderRef={loaderRef}
          activeChatId={activeChatId}
          userId={userId}
          handleDeleteMessage={handleDeleteMessage}
          chatContainer={chatContainer}
        />
      )}
      <MessageInput handleSendMessage={handleSendMessage} />
    </div>
  );
};
