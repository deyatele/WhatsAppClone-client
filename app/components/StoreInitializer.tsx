"use client";

import { useEffect } from "react";
import { useChat } from "../lib/hooks/useChat";
import { useChatStore } from "../lib/store";
import type { Chat, ChatResponse } from "../types";

function StoreInitializer({ chats }: { chats: ChatResponse[] }) {
  const {
    password,
    userId,
    pendingChats,
    setPendingChats,
    updateChatsWithPending,
    initialChatsLoaded,
  } = useChatStore();
  const { decryptedMessages } = useChat();

  useEffect(() => {
    if (!password || !userId || initialChatsLoaded) return;

    // Обрабатываем только новые данные, если нет текущих pending данных
    if (chats.length && !pendingChats) {
      Promise.all(
        chats.map(async (chat) => {
          if (chat.messages) {
            return {
              ...chat,
              messages: await decryptedMessages(
                chat.messages,
                userId,
                password,
              ),
            };
          }
          return chat;
        }),
      )
        .then((chatsWithDecryptedMessages) => {
          setPendingChats(chatsWithDecryptedMessages as Chat[]);
        })
        .catch((error) => console.error("Ошибка при обработке:", error));
    }
  }, [
    chats,
    password,
    userId,
    initialChatsLoaded,
    pendingChats,
    setPendingChats,
    decryptedMessages,
  ]);

  // Автоматически применяем pending данные, если они есть и не происходит загрузка
  useEffect(() => {
    if (
      pendingChats &&
      !useChatStore.getState().isLoadingChats &&
      !initialChatsLoaded
    ) {
      updateChatsWithPending();
    }
  }, [pendingChats, initialChatsLoaded, updateChatsWithPending]);

  return null;
}

export default StoreInitializer;
