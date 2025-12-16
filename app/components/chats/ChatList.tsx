"use client";

import { useRouter } from "next/navigation";

// React imports
import { memo, useCallback, useState } from "react";
// Internal modules
import { logoutAction } from "../../lib/serverActions";
import { useChatStore } from "../../lib/store";
// Types
import { useUser } from "../providers/UserProvider";
import { LogPanel } from "../ui/LogPanel";
import { ChatItem } from "./ChatItem";
import { ChatListEmptyState } from "./ChatListEmptyState";
import { ChatListHeader } from "./ChatListHeader";
import { ChatListLoadingState } from "./ChatListLoadingState";

const isDebug = process.env.NODE_ENV === "development";

const ChatListComponent = () => {
  const chats = useChatStore((state) => state.chats);
  const pendingChats = useChatStore((state) => state.pendingChats);
  const initialChatsLoaded = useChatStore((state) => state.initialChatsLoaded);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const isLoadingChats = useChatStore((state) => state.isLoadingChats);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);
  const toggleChatList = useChatStore((state) => state.toggleChatList);
  const { userId } = useUser();
  const router = useRouter();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutAction();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleChatClick = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId);
      if (useChatStore.getState().isChatListOpen && window.innerWidth < 768) {
        toggleChatList();
      }
    },
    [setActiveChatId, toggleChatList],
  );

  const chatsToDisplay =
    pendingChats && initialChatsLoaded ? pendingChats : chats;
  const showLoading = !initialChatsLoaded && isLoadingChats;
  const showEmptyState =
    !isLoadingChats && !initialChatsLoaded && chatsToDisplay.length === 0;

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
          {pendingChats && initialChatsLoaded && (
            <div className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-70 flex items-center justify-center h-10">
              <p className="text-gray-40 text-sm">Обновление чатов...</p>
            </div>
          )}
        </div>
      </div>
      {isDebug && (
        <div className="absolute z-1000 bottom-0 pb-15 w-full">
          <LogPanel />
        </div>
      )}
    </div>
  );
};

const MemoizedChatList = memo(ChatListComponent);
export { MemoizedChatList as ChatList };
