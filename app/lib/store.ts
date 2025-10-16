import { create } from "zustand";

import type { Chat } from "../lib/api";

// Определяем типы заранее
interface Message {
  id: string;
  content: string;
  createdAt: string;
  chatId: string;
  sender: { id: string; name: string | null };
}

interface ChatState {
  activeChatId: string | null;
  messages: Message[];
  chats: Chat[];
  callState: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: { from: string; sdp: RTCSessionDescriptionInit } | null;
  peerConnection: RTCPeerConnection | null;
  userId: string | null;
  logs: { message: string; id: string }[] | null;
  setActiveChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setChats: (chats: Chat[]) => void;
  setCallState: (callState: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setIncomingCall: (
    call: { from: string; sdp: RTCSessionDescriptionInit } | null,
  ) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  setUserId: (id: string | null) => void;
  addLog: (log: { message: string; id: string }) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChatId: null,
  messages: [],
  chats: [],
  callState: "idle",
  localStream: null,
  remoteStream: null,
  incomingCall: null,
  peerConnection: null,
  userId: null,
  logs: null,
  setActiveChatId: (id) => set({ activeChatId: id, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setChats: (chats) => set({ chats }),
  setCallState: (callState: string) => set({ callState }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }), // Реализуем setRemoteStream
  setIncomingCall: (call) => set({ incomingCall: call }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),
  setUserId: (id) => set({ userId: id }),
  addLog: (log) =>
    set((state) => ({
      logs: log ? (state.logs ? [log, ...state.logs] : [log]) : null,
    })),
}));
