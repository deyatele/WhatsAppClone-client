"use client";

import { useChat } from "../lib/hooks/useChat";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { useUser } from "./UserProvider";
import { Welcome } from "./Welcome";

export const ChatWindow = () => {
  const {
    activeChatId,
    otherUser,
    activeChatMessages,
    pagination,
    chatContainerRef,
    loaderRef,
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleDeleteMessage
  } = useChat();
  const { userId } = useUser();
  if (!activeChatId) {
    return <Welcome />;
  }

  const lastMessage = activeChatMessages[activeChatMessages.length - 1];
  const currentChatPagination = pagination[activeChatId] || {
    isLoading: false,
    hasMore: true,
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <ChatHeader otherUser={otherUser} lastMessage={lastMessage} />
      <MessageList
        messages={activeChatMessages}
        chatContainerRef={chatContainerRef}
        loaderRef={loaderRef}
        pagination={currentChatPagination}
        activeChatId={activeChatId}
        userId={userId}
        handleDeleteMessage={handleDeleteMessage}
      />
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
};
