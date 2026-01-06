"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { useChat } from "../../lib/hooks/useChat";
import { log } from "../../lib/log";
import { useChatStore } from "../../lib/store";
import { webRTCManager } from "../../lib/WebRTCManager";
import type { Chat, Message, MessageResponse } from "../../types";
import { useToast } from "./ToastProvider";

interface SocketContextType {
  socket: Socket | null;
}
const SocketContext = createContext<SocketContextType>({ socket: null });
export const useSocket = () => {
  return useContext(SocketContext);
};
interface SocketProviderProps {
  children: React.ReactNode;
  token: string | undefined;
}
export const SocketProvider = ({ children, token }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { addToast } = useToast();
  const {
    setUserId,
    addMessageToEnd,
    removeMessage,
    password,
    userId,
    setChat,
  } = useChatStore();
  const { decryptedMessage } = useChat();
  useEffect(() => {
    if (!token || !userId || !password) return;
    const API_URL =
      (process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_API_URL
        : process.env.NEXT_PUBLIC_BASE_URL_PROD) || "http://127.0.0.1:3001";
    const socketUrl = new URL(API_URL).origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      secure: true,
      // rejectUnauthorized: process.env.NODE_ENV !== "development",
    });
    newSocket.on("connect", () => {
      log(`DEBUG:✅ WebSocket подключен: ${newSocket.id}`);
      webRTCManager.initialize(newSocket);
    });
    newSocket.on("connect_error", (err) => {
      log(`ERROR:❌ Ошибка подключения WebSocket: ${err.message}`);
    });
    newSocket.on("id", (id: string) => {
      setUserId(id);
      log(`DEBUG:Мой ID: ${id}`);
    });
    newSocket.on("call:ended", (payload) => {
      log(`DEBUG: webinar:ended получен ${payload}`);
      webRTCManager.closeConnection();
    });
    newSocket.on("message:new", async (message: MessageResponse) => {
      try {
        const decodeMessage = await decryptedMessage(message);
        if (!decodeMessage)
          return log("DEBUG: Сообщение не расшифровано или пусто.");
        addMessageToEnd(decodeMessage);
      } catch (error) {
        log(`ERROR: ${error}`);
      }
    });
    newSocket.on("message:deleted", (message: Message) => {
      removeMessage(message);
    });
    newSocket.on("chat:created", ({ chat }: { chat: Chat }) => {
      const user = chat.participants.find((p) => p.user.id !== userId)?.user;
      addToast(`Присоединился новый пользователь ${user?.name ?? "!"}`);
      setChat({ ...chat, messages: [] });
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [
    token,
    setUserId,
    addMessageToEnd,
    removeMessage,
    decryptedMessage,
    setChat,
    addToast,
    password,
    userId,
  ]);
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
