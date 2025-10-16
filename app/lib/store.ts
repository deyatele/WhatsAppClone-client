import { create } from "zustand";

import type { Chat, Message } from "../lib/api";
export type { Message };

// Состояние пагинации для каждого чата
export interface PaginationState {
  cursor?: string;
  hasMore: boolean;
  isLoading: boolean;
}

interface ChatState {
  activeChatId: string | null;
  messages: Record<string, Message[]>;
  pagination: Record<string, PaginationState>;
  chats: Chat[];
  callState: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: { from: string; sdp: RTCSessionDescriptionInit } | null;
  peerConnection: RTCPeerConnection | null;
  userId: string | null;
  logs: { message: string; id: string }[] | null;

  // Actions
  setActiveChatId: (id: string | null) => void;
  setInitialMessages: (chatId: string, messages: Message[]) => void;
  addMessagesToStart: (chatId: string, messages: Message[]) => void;
  addMessageToEnd: (message: Message) => void;
  setChats: (chats: Chat[]) => void;
  setPaginationState: (chatId: string, state: Partial<PaginationState>) => void;
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
  messages: {},
  pagination: {},
  chats: [],
  callState: "idle",
  localStream: null,
  remoteStream: null,
  incomingCall: null,
  peerConnection: null,
  userId: null,
  logs: null,

  setActiveChatId: (id) => set({ activeChatId: id }),

  setInitialMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    })),

  addMessagesToStart: (chatId, newMessages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...newMessages, ...(state.messages[chatId] || [])],
      },
    })),

  addMessageToEnd: (message) =>
    set((state) => {
      const { chatId } = message;
      const chatMessages = state.messages[chatId] || [];
      if (chatMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [chatId]: [...chatMessages, message],
        },
      };
    }),

  setChats: (chats) => set({ chats }),

  setPaginationState: (chatId, newPaginationState) =>
    set((state) => ({
      pagination: {
        ...state.pagination,
        [chatId]: {
          ...(state.pagination[chatId] || { hasMore: true, isLoading: false }),
          ...newPaginationState,
        },
      },
    })),

  setCallState: (callState: string) => set({ callState }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),
  setUserId: (id) => set({ userId: id }),
  addLog: (log) =>
    set((state) => ({
      logs: log ? (state.logs ? [log, ...state.logs] : [log]) : null,
    })),
}));
