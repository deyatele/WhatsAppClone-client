"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { useChat } from "../lib/hooks/useChat";
import { log } from "../lib/log";
import { useChatStore } from "../lib/store";
import { webRTCManager } from "../lib/WebRTCManager";
import type { Message, MessageResponse } from "../types";

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
  const { setUserId, addMessageToEnd, removeMessage, password, userId } =
    useChatStore();
  const { decryptedMessage } = useChat();
  useEffect(() => {
    if (!token || !userId || !password) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:3001";
    const socketUrl = new URL(API_URL).origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      secure: true,
      rejectUnauthorized: process.env.NODE_ENV !== "development",
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
      log(`DEBUG:📴 call:ended получен ${payload}`);
      webRTCManager.closeConnection();
    });
    newSocket.on("message:new", async (message: MessageResponse) => {
      try {
        const decodeMessage = await decryptedMessage(message);
        if (!decodeMessage) return log("DEBUG: Сообщение не расшифровано или пусто.");
        addMessageToEnd(decodeMessage);
      } catch (error) {
        log(`ERROR: ${error}`);
      }
    });
    newSocket.on("message:deleted", (message: Message) => {
      removeMessage(message);
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
    password,
    userId,
  ]);
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
