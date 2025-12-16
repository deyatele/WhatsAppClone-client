"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChatList } from "./components/chats/ChatList";
import { ChatWindow } from "./components/chats/ChatWindow";
import JoinChatModal from "./components/modal/joinChatModal";
import PasswordModale from "./components/modal/passwordModal";
import StoreInitializer from "./components/StoreInitializer";
import Modal from "./components/ui/Modal";
import { getChatsAction } from "./lib/serverActions";
import { useChatStore } from "./lib/store";
import type { ChatResponse } from "./types";

export default function Home() {
  const [chats, setChats] = useState<ChatResponse[]>([]);
  const { isChatListOpen, setIsChatList, activeChatId } = useChatStore();
  const setPassword = useChatStore((state) => state.setPassword);
  const password = useChatStore((state) => state.password);
  const setUserId = useChatStore((state) => state.setUserId);
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const [error, setError] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const handlePasswordSubmit = useCallback(
    async (newPassword: string) => {
      if (!newPassword.trim()) {
        setError("Поле не может быть пустым");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const response = await fetch("/api/auth/validate-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newPassword }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Неверный пароль");
        }

        setPassword(newPassword);
        setIsPasswordModalOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка");
      } finally {
        setLoading(false);
      }
    },
    [setPassword],
  );

  useEffect(() => {
    const handleResize = () => {
      if (
        activeChatId &&
        isChatListOpen &&
        isMounted &&
        window.innerWidth < 768
      ) {
        setIsChatList(false);
      }
      console.log("first");
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [activeChatId, isChatListOpen, isMounted, setIsChatList]);

  useEffect(() => {
    if (isMounted && !password) {
      setIsPasswordModalOpen(true);
    }
  }, [isMounted, password]);

  useEffect(() => {
    if (!password || !isMounted) return;

    const fetchData = async () => {
      useChatStore.getState().setIsLoadingChats(true);
      try {
        const { chats, userId } = await getChatsAction();
        setChats(chats);
        userId && setUserId(userId);
      } finally {
        useChatStore.getState().setIsLoadingChats(false);
      }
    };
    fetchData();
  }, [password, isMounted, setUserId]);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <main className="flex h-screen overflow-hidden w-full">
      <StoreInitializer chats={chats} />
      <div
        className={`
          w-full md:w-1/3
          absolute md:relative
          h-full z-20
          transition-transform duration-300 ease-in-out
          ${isChatListOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <ChatList />
      </div>
      <div className="w-full md:w-2/3">
        <ChatWindow />
      </div>
      <Modal isOpen={Boolean(invite) ?? false} onClose={() => {}}>
        {invite && <JoinChatModal inviteToken={invite} />}
      </Modal>
      <Modal isOpen={isPasswordModalOpen} onClose={() => {}}>
        <PasswordModale
          handleAction={handlePasswordSubmit}
          error={error}
          loading={loading}
        />
      </Modal>
    </main>
  );
}
