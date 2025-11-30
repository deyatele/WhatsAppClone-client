"use client";

import { useRouter } from "next/navigation";

// React imports
import { useCallback, useMemo, useState } from "react";
// Internal modules
import { logoutAction } from "../../lib/serverActions";
import { useChatStore } from "../../lib/store";
// Types
import type { Chat } from "../../types";
import { useUser } from "../providers/UserProvider";
import { LogPanel } from "../ui/LogPanel";
import { ChatItem } from "./ChatItem";
import { ChatListEmptyState } from "./ChatListEmptyState";
import { ChatListHeader } from "./ChatListHeader";
import { ChatListLoadingState } from "./ChatListLoadingState";

const isDebug = process.env.NODE_ENV === "development";

export const ChatList = () => {
  const {
    chats,
    pendingChats,
    initialChatsLoaded,
    setActiveChatId,
    activeChatId,
    toggleChatList,
    isChatListOpen,
    isLoadingChats,
  } = useChatStore();
  const { userId } = useUser();
  const router = useRouter();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [_disabled] = useState(true); // Заглушка для неактивных функций

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutAction();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const _getOtherParticipant = useCallback(
    (chat: Chat) => {
      if (!userId || !chat.participants) return null;
      return chat.participants.find((p) => p.user.id !== userId)?.user;
    },
    [userId],
  );

  const handleChatClick = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId);
      if (isChatListOpen && window.innerWidth < 768) {
        toggleChatList();
      }
    },
    [setActiveChatId, isChatListOpen, toggleChatList],
  );

  // Определяем, какие чаты показывать
  const chatsToDisplay = useMemo(
    () => (pendingChats && initialChatsLoaded ? pendingChats : chats),
    [pendingChats, initialChatsLoaded, chats],
  );

  const showLoading = useMemo(
    () => !initialChatsLoaded && isLoadingChats,
    [initialChatsLoaded, isLoadingChats],
  );

  const showEmptyState = useMemo(
    () => !isLoadingChats && !initialChatsLoaded && chatsToDisplay.length === 0,
    [isLoadingChats, initialChatsLoaded, chatsToDisplay.length],
  );

  return (
    <div className="relative h-full">
      <div className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
        <ChatListHeader
          loading={loading}
          handleLogout={handleLogout}
          setIsNewChatOpen={setIsNewChatOpen}
          isNewChatOpen={isNewChatOpen}
        />

        {/* Чаты пользователя */}
        <div className="overflow-y flex-1">
          {showLoading ? (
            <ChatListLoadingState />
          ) : showEmptyState ? (
            <ChatListEmptyState />
          ) : (
            chatsToDisplay.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                userId={userId}
                activeChatId={activeChatId}
                handleChatClick={handleChatClick}
              />
            ))
          )}
          {/* Индикатор обновления при pending данных */}
          {pendingChats && initialChatsLoaded && (
            <div className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-70 flex items-center justify-center h-10">
              <p className="text-gray-40 text-sm">Обновление чатов...</p>
            </div>
          )}
        </div>
      </div>
      {isDebug && (
        <div className="absolute z-[1000] bottom-0 pb-15 w-[100%]">
          <LogPanel />
        </div>
      )}
    </div>
  );
};
