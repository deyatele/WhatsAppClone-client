"use client";

import { useEffect, useRef } from "react";
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
  const _initialized = useRef(false);
  const { decryptedMessages } = useChat();

  useEffect(() => {
    if (!password || !userId) return;

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
          // Немедленно применяем, если это первая загрузка
          if (!initialChatsLoaded) {
            updateChatsWithPending();
          }
        })
        .catch((error) => console.error("Ошибка при обработке:", error));
    }
  }, [
    chats,
    password,
    decryptedMessages,
    userId,
    pendingChats,
    setPendingChats,
    updateChatsWithPending,
    initialChatsLoaded,
  ]);

  // Автоматически применяем pending данные, если они есть и не происходит загрузка
  useEffect(() => {
    if (pendingChats && !useChatStore.getState().isLoadingChats) {
      updateChatsWithPending();
    }
  }, [pendingChats, updateChatsWithPending]);

  return null;
}

export default StoreInitializer;
