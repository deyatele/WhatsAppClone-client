"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "../lib/store";
import type { Chat } from "../types";

function StoreInitializer({ chats }: { chats: Chat[] }) {
  const setChats = useChatStore((state) => state.setChats);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setChats(chats);
      initialized.current = true;
    }
  }, [chats, setChats]);

  return null;
}

export default StoreInitializer;
