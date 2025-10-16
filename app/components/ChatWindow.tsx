"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Loader } from "../components/Loader";
import { useSocket } from "../components/SocketProvider";
import { useUser } from "../components/UserProvider";
import type { Chat } from "../lib/api";
import { chatApi } from "../lib/api";
import { useChatStore } from "../lib/store";
import { formatTimestamp } from "../lib/utils";

// Хук, который использует useLayoutEffect на клиенте и useEffect на сервере
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const Welcome = () => (
  <div className="h-full flex flex-col items-center justify-center text-center bg-gray-900">
    <div className="w-2/3">
      <h1 className="text-3xl font-light text-gray-300">WhatsApp Web</h1>
      <p className="mt-4 text-gray-400">Выберите чат, чтобы начать общение.</p>
    </div>
  </div>
);

export const ChatWindow = () => {
  const { userId } = useUser();
  const { socket } = useSocket();
  const store = useChatStore();

  const { activeChatId, chats, messages, pagination } = store;
  const activeChatMessages = messages[activeChatId || ""] || [];
  const messageCount = activeChatMessages.length;

  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const scrollStateRef = useRef({
    oldScrollHeight: 0,
    shouldAdjustScroll: false,
  });

  const loadMessages = useCallback(
    async (isInitial = false) => {
      const currentPagination = useChatStore.getState().pagination[activeChatId || ""] || {
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
          15,
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
    [activeChatId, store],
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
      },
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
      const hasMessages = useChatStore.getState().messages[activeChatId]?.length > 0;
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

  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChatId) return;
    socket.emit("message:send", { chatId: activeChatId, text: newMessage });
    setNewMessage("");
  };

  if (!activeChatId) {
    return <Welcome />;
  }

  const activeChat: Chat | undefined = chats.find((chat) => chat.id === activeChatId);
  const otherUser = activeChat?.participants.find(
    (p) => p.user.id !== userId,
  )?.user;

  const lastMessage = activeChatMessages[activeChatMessages.length - 1];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-3 border-b border-gray-700 bg-gray-800 flex items-center">
        <div>
          <h2 className="text-xl font-bold text-white">{otherUser?.name || "Чат"}</h2>
          {lastMessage && (
            <p className="text-xs text-gray-400">
              был(-а) в {formatTimestamp(lastMessage.createdAt)}
            </p>
          )}
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        <div ref={loaderRef}>
          {pagination[activeChatId || ""]?.isLoading && <Loader />}
        </div>
        <div className="space-y-2">
          {activeChatMessages.map((msg) => {
            const isCurrentUser = msg.sender.id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`p-3 rounded-lg max-w-md ${isCurrentUser ? "bg-green-800" : "bg-gray-700"} text-white`}>
                  {!isCurrentUser && (
                    <p className="text-sm font-bold text-green-400">
                      {msg.sender?.name || "User"}
                    </p>
                  )}
                  <p className="break-words">{msg.content}</p>
                  <p className="text-xs text-right text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-gray-800">
        <input
          type="text"
          placeholder="Введите сообщение..."
          className="w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
      </form>
    </div>
  );
};