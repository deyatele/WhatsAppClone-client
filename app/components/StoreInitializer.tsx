"use client";

import { useEffect, useRef } from "react";
import { useChat } from "../lib/hooks/useChat";
import { useChatStore } from "../lib/store";
import type { ChatResponse } from "../types";

function StoreInitializer({ chats }: { chats: ChatResponse[] }) {
  const { setChats, password, userId } = useChatStore();
  const initialized = useRef(false);
  const { decryptedMessages } = useChat();

  useEffect(() => {
    if (!password || !userId) return;
    if (!initialized.current) {
      Promise.all(
        chats.map(async (chat) => ({
          ...chat,
          messages: await decryptedMessages(chat.messages, userId, password),
        })),
      )
        .then((chatsWithDecryptedMessages) => {
          setChats(chatsWithDecryptedMessages);
          initialized.current = true;
        })
        .catch((error) => console.error("Ошибка при обработке:", error));
    }
  }, [chats, setChats, password, decryptedMessages, userId]);

  return null;
}

export default StoreInitializer;
