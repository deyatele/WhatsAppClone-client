import { create } from "zustand";
import type { Chat, Message, PaginationState } from "../types";

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
  pubKeyUser: JsonWebKey | null;
  password: string | null;

  // Действия
  setActiveChatId: (id: string | null) => void;
  setInitialMessages: (chatId: string, messages: Message[]) => void;
  addMessagesToStart: (chatId: string, messages: Message[]) => void;
  addMessageToEnd: (message: Message) => void;
  removeMessage: (message: Message) => void;
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
  setPubKeyUser: (key: JsonWebKey | null) => void;
  setPassword: (password: string) => void;
}
// Вспомогательные функции для работы с сообщениями
const messageUtils = {
  shouldRemoveMessage: (message: Message, userId: string | null): boolean => {
    const { deletedReceiver, deletedSender, sender } = message;

    if (deletedReceiver && deletedSender) return true;
    if (deletedReceiver && sender.id !== userId) return true;
    if (deletedSender && sender.id === userId) return true;

    return false;
  },

  updateChatLastMessage: (
    chat: Chat,
    messages: Message[],
    deletedMessageId: string,
  ): Chat => {
    if (!chat.messages?.[0]) return chat;

    const lastMessage = messages.at(-2);
    if (chat.messages[0].id === deletedMessageId && lastMessage) {
      return {
        ...chat,
        messages: [lastMessage],
      };
    }

    return chat;
  },
};

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
  pubKeyUser: null,
  password: null,

  setPassword: (password) => set({ password }),

  setPubKeyUser: (key: JsonWebKey | null) => set({ pubKeyUser: key }),

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

  addMessageToEnd: async (message) => {
    set((state) => {
      const { chatId } = message;

      const chatMessages = state.messages[chatId] || [];
      // Проверка на дубликат
      if (chatMessages.some((m) => m.id === message.id)) {
        return state;
      }

      // Обновление чата
      const updatedChats = state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [message, ...(chat.messages || [])] }
          : chat,
      );

      return {
        chats: updatedChats,
        messages: {
          ...state.messages,
          [chatId]: [...chatMessages, message],
        },
      };
    });
  },

  removeMessage: (message) =>
    set((state) => {
      const { chatId } = message;
      const chatMessages = state.messages[chatId];

      if (!chatMessages?.length) return state;

      // Проверяем, нужно ли удалять сообщение
      if (!messageUtils.shouldRemoveMessage(message, state.userId)) {
        return state;
      }

      // Обновляем последнее сообщение в чате
      const updatedChats = state.chats.map((chat) =>
        chat.id === chatId
          ? messageUtils.updateChatLastMessage(chat, chatMessages, message.id)
          : chat,
      );

      // Фильтруем сообщения
      const filteredMessages = chatMessages.filter((m) => m.id !== message.id);

      return {
        chats: updatedChats,
        messages: {
          ...state.messages,
          [chatId]: filteredMessages,
        },
      };
    }),

  setChats: (chats) => set({ chats }),

  setPaginationState: (chatId, newPaginationState) =>
    set((state) => {
      const currentPagination = state.pagination[chatId] || {
        hasMore: true,
        isLoading: false,
      };

      return {
        pagination: {
          ...state.pagination,
          [chatId]: {
            ...currentPagination,
            ...newPaginationState,
          },
        },
      };
    }),

  setCallState: (callState: string) => set({ callState }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),
  setUserId: (id) => set({ userId: id }),

  addLog: (log) =>
    set((state) => ({
      logs: log ? [log, ...(state.logs || [])] : null,
    })),
}));
