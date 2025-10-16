
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSocket } from "../../components/SocketProvider";
import { useUser } from "../../components/UserProvider";
import type { Chat } from "../api";
import { chatApi } from "../api";
import { useChatStore } from "../store";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const useChat = () => {
  const { userId } = useUser();
  const { socket } = useSocket();
  const store = useChatStore();

  const { activeChatId, chats, messages, pagination } = store;
  const activeChatMessages = messages[activeChatId || ""] || [];
  const messageCount = activeChatMessages.length;

  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const scrollStateRef = useRef({
    oldScrollHeight: 0,
    shouldAdjustScroll: false,
  });

  const loadMessages = useCallback(
    async (isInitial = false) => {
      const currentPagination = useChatStore.getState().pagination[
        activeChatId || ""
      ] || {
        hasMore: true,
      };

      if (isLoadingRef.current || !activeChatId || !currentPagination.hasMore) {
        return;
      }
      isLoadingRef.current = true;
      store.setPaginationState(activeChatId, { isLoading: true });

      try {
        const cursor = isInitial ? undefined : currentPagination.cursor;
        const { messages: newMessages, nextCursor } = await chatApi.getMessages(
          activeChatId,
          cursor,
          15
        );

        const chronologicalMessages = newMessages.reverse();

        if (isInitial) {
          store.setInitialMessages(activeChatId, chronologicalMessages);
        } else {
          store.addMessagesToStart(activeChatId, chronologicalMessages);
        }

        store.setPaginationState(activeChatId, {
          cursor: nextCursor ?? undefined,
          hasMore: nextCursor !== null,
        });
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        isLoadingRef.current = false;
        store.setPaginationState(activeChatId, { isLoading: false });
      }
    },
    [activeChatId, store]
  );

  useEffect(() => {
    if (!isInitialLoadComplete) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const chatContainer = chatContainerRef.current;
          if (chatContainer) {
            scrollStateRef.current = {
              oldScrollHeight: chatContainer.scrollHeight,
              shouldAdjustScroll: true,
            };
          }
          loadMessages();
        }
      },
      {
        root: chatContainerRef.current,
        threshold: 1.0,
      }
    );

    const loaderElement = loaderRef.current;
    if (loaderElement) {
      observer.observe(loaderElement);
    }

    return () => {
      if (loaderElement) {
        observer.unobserve(loaderElement);
      }
    };
  }, [isInitialLoadComplete, loadMessages]);

  useEffect(() => {
    if (activeChatId) {
      setIsInitialLoadComplete(false);
      const hasMessages =
        useChatStore.getState().messages[activeChatId]?.length > 0;
      if (!hasMessages) {
        loadMessages(true).then(() => {
          setIsInitialLoadComplete(true);
        });
      } else {
        setIsInitialLoadComplete(true);
      }
    }
  }, [activeChatId, loadMessages]);

  useIsomorphicLayoutEffect(() => {
    if (messageCount === 0) return;

    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const { oldScrollHeight, shouldAdjustScroll } = scrollStateRef.current;

    if (shouldAdjustScroll) {
      const newScrollHeight = chatContainer.scrollHeight;
      chatContainer.scrollTop = newScrollHeight - oldScrollHeight;
      scrollStateRef.current.shouldAdjustScroll = false;
    } else {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messageCount]);

  useEffect(() => {
    if (socket && activeChatId) {
      socket.emit("chat:join", { chatId: activeChatId });

      return () => {
        socket.emit("chat:leave", { chatId: activeChatId });
      };
    }
  }, [socket, activeChatId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChatId) return;
    socket.emit("message:send", { chatId: activeChatId, text: newMessage });
    setNewMessage("");
  };

  const activeChat: Chat | undefined = chats.find(
    (chat) => chat.id === activeChatId
  );
  const otherUser = activeChat?.participants.find(
    (p) => p.user.id !== userId
  )?.user;

  return {
    activeChatId,
    activeChat,
    otherUser,
    activeChatMessages,
    pagination,
    chatContainerRef,
    loaderRef,
    newMessage,
    setNewMessage,
    handleSendMessage,
  };
};
