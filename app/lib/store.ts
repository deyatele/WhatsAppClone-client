import { create } from "zustand";
import type { Chat, Message, PaginationState } from "../types";

interface ChatState {
  activeChatId: string | null;
  messages: Record<string, Message[]>;
  pagination: Record<string, PaginationState>;
  chats: Chat[];
  connectedChatIds: Set<string>;
  callState: string;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: { from: string; sdp: RTCSessionDescriptionInit } | null;
  peerConnection: RTCPeerConnection | null;
  userId: string | null;
  logs: { message: string; id: string }[] | null;
  pubKeyUser: JsonWebKey | null;
  password: string | null;
  isChatListOpen: boolean;
  initialChatsLoaded: boolean;
  pendingChats: Chat[] | null;

  // Действия
  toggleChatList: () => void;
  setIsChatList: (value: boolean) => void;
  setActiveChatId: (id: string | null) => void;
  setInitialMessages: (chatId: string, messages: Message[]) => void;
  addMessagesToStart: (chatId: string, messages: Message[]) => void;
  addMessageToEnd: (message: Message) => void;
  removeMessage: (message: Message) => void;
  setChats: (chats: Chat[]) => void;
  setChat: (chat: Chat) => void;
  setIsLoadingChats: (isLoading: boolean) => void;
  setIsLoadingMessages: (isLoading: boolean) => void;
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
  addConnectedChatId: (chatId: string) => void;
  removeConnectedChatId: (chatId: string) => void;
  setInitialChatsLoaded: (loaded: boolean) => void;
  setPendingChats: (chats: Chat[] | null) => void;
  updateChatsWithPending: () => void;
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
};
export const useChatStore = create<ChatState>((set, _get) => ({
  activeChatId: null,
  messages: {},
  pagination: {},
  chats: [],
  connectedChatIds: new Set(),
  callState: "idle",
  isLoadingChats: false,
  isLoadingMessages: false,
  localStream: null,
  remoteStream: null,
  incomingCall: null,
  peerConnection: null,
  userId: null,
  logs: null,
  pubKeyUser: null,
  password: null,
  isChatListOpen: true,
  initialChatsLoaded: false,
  pendingChats: null,

  toggleChatList: () =>
    set((state) => ({ isChatListOpen: !state.isChatListOpen })),

  setIsChatList: (value) => set({ isChatListOpen: value }),

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
        chat.id === chatId ? { ...chat, messages: [message] } : chat,
      );

      // Перемещаем обновленный чат в начало списка
      const chatToMove = updatedChats.find((chat) => chat.id === chatId);
      const otherChats = updatedChats.filter((chat) => chat.id !== chatId);

      const finalChats = chatToMove ? [chatToMove, ...otherChats] : otherChats;
      return {
        chats: finalChats,
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

      // Фильтруем сообщения
      const filteredMessages = chatMessages.filter((m) => m.id !== message.id);
      const newLastMessage = filteredMessages.at(-1);

      // Обновляем последнее сообщение в чате
      const updatedChats = state.chats
        .map((chat) =>
          chat.id === chatId && newLastMessage
            ? { ...chat, messages: [newLastMessage] }
            : chat,
        )
        .sort((a, b) => {
          const aLastMessage = a.messages?.[0];
          const bLastMessage = b.messages?.[0];

          if (!aLastMessage) return 1;
          if (!bLastMessage) return -1;

          return (
            new Date(bLastMessage.createdAt).getTime() -
            new Date(aLastMessage.createdAt).getTime()
          );
        });

      return {
        chats: updatedChats,
        messages: {
          ...state.messages,
          [chatId]: filteredMessages,
        },
      };
    }),

  setChats: (chats) =>
    set({
      chats: chats.sort((a, b) => {
        const aLastMessage = a.messages?.[0];
        const bLastMessage = b.messages?.[0];

        if (!aLastMessage) return 1;
        if (!bLastMessage) return -1;

        return (
          new Date(bLastMessage.createdAt).getTime() -
          new Date(aLastMessage.createdAt).getTime()
        );
      }),
    }),
  setIsLoadingChats: (isLoading) => set({ isLoadingChats: isLoading }),
  setIsLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),
  addConnectedChatId: (chatId: string) =>
    set((state) => {
      const newSet = new Set(state.connectedChatIds);
      newSet.add(chatId);
      return { connectedChatIds: newSet };
    }),
  removeConnectedChatId: (chatId: string) =>
    set((state) => {
      const newSet = new Set(state.connectedChatIds);
      newSet.delete(chatId);
      return { connectedChatIds: newSet };
    }),

  setChat: (chat) =>
    set((state) => {
      const updatedChats = [
        { ...chat },
        ...state.chats.filter((c) => c.id !== chat.id),
      ];
      return { chats: updatedChats };
    }),

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

  addLog: (log) => {
    set((state) => ({
      logs: log ? [log, ...(state.logs || [])] : null,
    }));
  },

  setInitialChatsLoaded: (loaded) => set({ initialChatsLoaded: loaded }),

  setPendingChats: (chats) => set({ pendingChats: chats }),

  updateChatsWithPending: () =>
    set((state) => {
      if (state.pendingChats) {
        return {
          chats: state.pendingChats.sort((a, b) => {
            const aLastMessage = a.messages?.[0];
            const bLastMessage = b.messages?.[0];

            if (!aLastMessage) return 1;
            if (!bLastMessage) return -1;

            return (
              new Date(bLastMessage.createdAt).getTime() -
              new Date(aLastMessage.createdAt).getTime()
            );
          }),
          pendingChats: null,
          initialChatsLoaded: true,
        };
      }
      return state;
    }),
}));
