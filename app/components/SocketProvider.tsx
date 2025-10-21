"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { log } from "../lib/log";
import { useChatStore } from "../lib/store";
import { webRTCManager } from "../lib/WebRTCManager";
import type { Message } from "../types";

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
  const { setUserId, addMessageToEnd, removeMessage } = useChatStore();
  useEffect(() => {
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:3001";
    const socketUrl = new URL(API_URL).origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      secure: true,
      rejectUnauthorized: process.env.NODE_ENV !== "development",
    });
    newSocket.on("connect", () => {
      console.log("✅ WebSocket connected:", newSocket.id);
      webRTCManager.initialize(newSocket);
    });
    newSocket.on("connect_error", (err) => {
      console.error("❌ WebSocket connection error:", err.message);
    });
    newSocket.on("id", (id: string) => {
      setUserId(id);
      log(`My ID: ${id}`);
    });
    newSocket.on("call:ended", (payload) => {
      log(`📴 call:ended received ${payload}`);
      webRTCManager.closeConnection();
    });
    newSocket.on("message:new", (message: Message) => {
      addMessageToEnd(message);
    });
    newSocket.on("message:deleted", (message: Message) => {
      removeMessage(message);
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [token, setUserId, addMessageToEnd, removeMessage]);
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
