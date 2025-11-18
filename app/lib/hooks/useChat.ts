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
import type { Chat, Message, MessageResponse } from "../../types";
import { chatApi } from "../api";
import { getPrivateKey, getPublicJwk } from "../crypto/keyManager";
import {
  decryptMessageForOne,
  encryptMessageForTwo,
} from "../crypto/messageEncryptor";
import { useChatStore } from "../store";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const useChat = () => {
  const { userId } = useUser();
  const { socket } = useSocket();
  const store = useChatStore();

  const {
    activeChatId,
    chats,
    messages,
    pagination,
    pubKeyUser,
    setPubKeyUser,
    password,
  } = store;
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
  const addMessagesToStart = useChatStore((s) => s.addMessagesToStart);
  const setInitialMessages = useChatStore((s) => s.setInitialMessages);
  const setPaginationState = useChatStore((s) => s.setPaginationState);

  const decryptedMessages = useCallback(
    async (
      newMessages: MessageResponse[],
      userId: string,
      password: string,
    ) => {
      const privateKey = await getPrivateKey(password, userId);
      const messages: Message[] = [];
      for (const message of newMessages) {
        const { encryptedMessage, ...messageOther } = message;
        try {
          const {
            encryptedMessage: encMess,
            encryptedKeyForReceiver,
            encryptedKeyForSender,
          } = encryptedMessage;

          const text = await decryptMessageForOne({
            encryptedMessage: encMess,
            privateKey,
            encryptedKeyB64:
              message.senderId === userId
                ? encryptedKeyForSender
                : encryptedKeyForReceiver,
          });
          messages.push({ ...messageOther, message: text });
        } catch {
          messages.push({
            ...messageOther,
            message: "Не получилось расшифровать",
          });
        }
      }
      return messages;
    },
    [],
  );

  const loadMessages = useCallback(
    async (isInitial = false) => {
      if (!password || !userId) return;
      const currentPagination = useChatStore.getState().pagination[
        activeChatId || ""
      ] || {
        hasMore: true,
      };

      if (isLoadingRef.current || !activeChatId || !currentPagination.hasMore) {
        return;
      }
      isLoadingRef.current = true;
      setPaginationState(activeChatId, { isLoading: true });

      try {
        const cursor = isInitial ? undefined : currentPagination.cursor;
        const { messages: newMessages, nextCursor } = await chatApi.getMessages(
          activeChatId,
          cursor,
          15,
        );
        const messages: Message[] = await decryptedMessages(
          newMessages,
          userId,
          password,
        );

        const chronologicalMessages = messages.reverse();

        if (isInitial) {
          setInitialMessages(activeChatId, chronologicalMessages);
        } else {
          addMessagesToStart(activeChatId, chronologicalMessages);
        }

        setPaginationState(activeChatId, {
          cursor: nextCursor ?? undefined,
          hasMore: nextCursor !== null,
        });
      } catch (error) {
        console.error("Не удалось загрузить сообщения:", error);
      } finally {
        isLoadingRef.current = false;
        setPaginationState(activeChatId, { isLoading: false });
      }
    },
    [
      activeChatId,
      password,
      userId,
      setPaginationState,
      setInitialMessages,
      addMessagesToStart,
      decryptedMessages,
    ],
  );

  const decryptedMessage = useCallback(async (
    newMessage: MessageResponse,
    userId: string,
    password: string,
  ) => {
    const privateKey = await getPrivateKey(password, userId);
    const { encryptedMessage, ...messageOther } = newMessage;
    try {
      const {
        encryptedMessage: encMess,
        encryptedKeyForReceiver,
        encryptedKeyForSender,
      } = encryptedMessage;

      const message = await decryptMessageForOne({
        encryptedMessage: encMess,
        privateKey,
        encryptedKeyB64:
          newMessage.senderId === userId
            ? encryptedKeyForSender
            : encryptedKeyForReceiver,
      });

      return { ...messageOther, message };
    } catch {}
  },[]);

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

  useEffect(() => {
    if (!userId || !activeChatId) return;
    getPublicJwk(userId).then((pubKey) => {
      setPubKeyUser(pubKey);
    });
  }, [userId, setPubKeyUser, activeChatId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChatId) return;
    const pubKeyOther = chats
      .find((chat) => chat.id === activeChatId)
      ?.participants.find((p) => p.user.id !== userId)?.user.publicKeyJwk;
    if (!pubKeyOther || !pubKeyUser) return;
    encryptMessageForTwo(newMessage, pubKeyUser, pubKeyOther).then((enMes) => {
      socket.emit("message:send", { chatId: activeChatId, text: enMes });
      setNewMessage("");
    });
  };

  const handleDeleteMessage = (
    messageId: Message["id"],
    flag: boolean = false,
  ) => {
    if (!socket) return;
    socket.emit("message:delete", { messageId, flag });
  };

  const activeChat: Chat | undefined = chats.find(
    (chat) => chat.id === activeChatId,
  );
  const otherUser = activeChat?.participants.find(
    (p) => p.user.id !== userId,
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
    handleDeleteMessage,
    decryptedMessages,
    decryptedMessage,
  };
};
