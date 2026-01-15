"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../../components/providers/SocketProvider";
import { useUser } from "../../components/providers/UserProvider";
import type { Chat, Message, MessageResponse } from "../../types";
import { chatApi } from "../api";
import { getPrivateKey, getPublicJwk } from "../crypto/keyManager";
import {
  decryptMessageForOne,
  encryptMessageForTwo,
} from "../crypto/messageEncryptor";
import { log } from "../log";
import { useChatStore } from "../store";

export const useChat = () => {
  const { userId } = useUser();
  const { socket } = useSocket();
  const activeChatId = useChatStore((s) => s.activeChatId);
  const chats = useChatStore((s) => s.chats);
  const messages = useChatStore((s) => s.messages);
  const pagination = useChatStore((s) => s.pagination);
  const pubKeyUser = useChatStore((s) => s.pubKeyUser);
  const password = useChatStore((s) => s.password);

  const setPubKeyUser = useChatStore((s) => s.setPubKeyUser);
  const addConnectedChatId = useChatStore((s) => s.addConnectedChatId);
  const removeConnectedChatId = useChatStore((s) => s.removeConnectedChatId);
  const activeChatMessages = messages[activeChatId || ""] || [];

  const [chatContainer, setChatContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [loader, setLoader] = useState<HTMLDivElement | null>(null);

  const chatContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setChatContainer(node);
    }
  }, []);

  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setLoader(node);
    }
  }, []);

  const isLoadingRef = useRef(false);

  const addMessagesToStart = useChatStore((s) => s.addMessagesToStart);
  const setPaginationState = useChatStore((s) => s.setPaginationState);

  const decryptedMessages = useCallback(
    async (
      newMessages: MessageResponse[] | undefined,
      userId: string,
      password: string,
    ) => {
      if (!newMessages) {
        return [];
      }
      let privateKey: CryptoKey;
      try {
        privateKey = await getPrivateKey(password, userId);
      } catch (e) {
        log(`ERROR: ${e}`);
        return [];
      }
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

  const loadMessages = useCallback(async () => {
    if (!password || !userId || !activeChatId) return;

    const currentPagination = useChatStore.getState().pagination[
      activeChatId || ""
    ] || {
      hasMore: true,
      isLoading: false,
    };

    // Проверяем, идет ли уже загрузка или больше нет сообщений для загрузки
    if (
      currentPagination.isLoading ||
      isLoadingRef.current ||
      !currentPagination.hasMore
    ) {
      return;
    }

    // Устанавливаем флаг загрузки через ref и store для предотвращения дублирующих запросов
    isLoadingRef.current = true;
    setPaginationState(activeChatId, { isLoading: true });

    try {
      const paginationWithCursor = currentPagination as {
        cursor?: string | null;
        hasMore: boolean;
      };

      const { messages: newMessages, nextCursor } = await chatApi.getMessages(
        activeChatId,
        paginationWithCursor.cursor ?? undefined,
        15,
      );
      const messages: Message[] = await decryptedMessages(
        newMessages,
        userId,
        password,
      );

      const sortedMessages = [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      addMessagesToStart(activeChatId, sortedMessages);

      setPaginationState(activeChatId, {
        cursor: nextCursor ?? undefined,
        hasMore: nextCursor !== null,
      });
    } catch (error) {
      log(`ERROR: Не удалось загрузить сообщения: ${error}`);
    } finally {
      isLoadingRef.current = false;
      setPaginationState(activeChatId, { isLoading: false });
    }
  }, [
    activeChatId,
    password,
    userId,
    setPaginationState,
    addMessagesToStart,
    decryptedMessages,
  ]);

  const decryptedMessage = useCallback(
    async (newMessage: MessageResponse) => {
      if (!userId || !password) throw new Error("Нет пользователя или пароля");
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
    },
    [password, userId],
  );

  useEffect(() => {
    if (!chatContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Проверяем, есть ли еще сообщения для загрузки
          const currentPagination = useChatStore.getState().pagination[
            activeChatId || ""
          ] || {
            hasMore: true,
            isLoading: false,
          };
          if (
            currentPagination.hasMore &&
            !currentPagination.isLoading &&
            !isLoadingRef.current
          ) {
            if (chatContainer) {
              loadMessages();
            }
          }
        }
      },
      {
        root: chatContainer,
        threshold: 0.1,
      },
    );

    if (loader) {
      observer.observe(loader);
    }
    return () => {
      if (loader) {
        observer.unobserve(loader);
      }
    };
  }, [loadMessages, activeChatId, chatContainer, loader]);

  useEffect(() => {
    if (!activeChatId) return;
    // Проверяем, не идет ли уже загрузка для этого чата
    const currentPagination = useChatStore.getState().pagination[
      activeChatId
    ] || {
      isLoading: false,
    };

    // Проверяем также isLoadingRef.current для дополнительной защиты от дублирования
    if (currentPagination.isLoading || isLoadingRef.current) {
      return; // Если загрузка уже идет, выходим
    }

    useChatStore.getState().setIsLoadingMessages(true);

    // Добавляем проверку, чтобы избежать повторной загрузки тех же сообщений
    const existingMessages =
      useChatStore.getState().messages[activeChatId] || [];
    if (existingMessages.length > 0) {
      // Прокручиваем к последним сообщениям
      useChatStore.getState().setIsLoadingMessages(false);
      return;
    }
    // Даже если сообщения есть в кэше, все равно нужно выполнить загрузку для обновления/расшифровки
    loadMessages().finally(() => {
      useChatStore.getState().setIsLoadingMessages(false);
    });
  }, [activeChatId, loadMessages]);

  const handleNewMessage = useCallback(
    async (message: MessageResponse) => {
      try {
        const decodedMessage = await decryptedMessage(message);
        if (!decodedMessage) return;
        // Добавляем сообщение в конец списка
        useChatStore.getState().addMessageToEnd(decodedMessage);
      } catch (error) {
        log(`ERROR: ${error}`);
      }
    },
    [decryptedMessage],
  );

  useEffect(() => {
    if (socket && activeChatId) {
      // Проверяем, подключены ли мы уже к этому чату
      const isConnected = useChatStore
        .getState()
        .connectedChatIds.has(activeChatId);
      if (!isConnected) {
        socket.emit("chat:join", { chatId: activeChatId });
        addConnectedChatId(activeChatId);
      }

      // Обработчик нового сообщения

      socket.on("message:new", handleNewMessage);

      return () => {
        socket.off("message:new", handleNewMessage);

        // Проверяем, подключены ли мы к этому чату перед отключением
        const isConnected = useChatStore
          .getState()
          .connectedChatIds.has(activeChatId);
        if (isConnected) {
          socket.emit("chat:leave", { chatId: activeChatId });
          removeConnectedChatId(activeChatId);
        }
      };
    }
  }, [
    socket,
    activeChatId,
    addConnectedChatId,
    removeConnectedChatId,
    handleNewMessage,
  ]);

  useEffect(() => {
    if (!userId || !activeChatId) return;
    getPublicJwk(userId).then((pubKey) => {
      setPubKeyUser(pubKey);
    });
  }, [userId, setPubKeyUser, activeChatId]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !socket || !activeChatId || !pubKeyUser) return;

    const pubKeyOther = chats
      .find((chat) => chat.id === activeChatId)
      ?.participants.find((p) => p.user.id !== userId)?.user.publicKeyJwk;
    if (!pubKeyOther || !pubKeyUser) return;

    encryptMessageForTwo(text, pubKeyUser, pubKeyOther)
      .then((enMes) => {
        socket.emit("message:send", { chatId: activeChatId, text: enMes });

        // После отправки сообщения пользователя, всегда скроллим к последнему сообщению
        if (chatContainer) {
          chatContainer.scrollTop = 0;
        }
      })
      .catch((e) => log(`ERROR: ${e}`));
  };

  const handleDeleteMessage = (
    messageId: Message["id"],
    flag: boolean = false,
  ) => {
    if (!socket) return;
    socket.emit("message:delete", { messageId, flag });
  };

  const handleActionCreateChat = (to: string, chatId: string) => {
    if (!socket) return;
    socket.emit("chat:create", { to, chatId });
  };

  const activeChat: Chat | undefined = chats.find(
    (chat) => chat.id === activeChatId,
  );
  const otherUser = activeChat?.participants.find(
    (p) => p.user.id !== userId,
  )?.user;

  const generateChatInviteLink = useCallback(async () => {
    try {
      const { id } = await chatApi.getInviteToken();
      const inviteLink = `${window.location.origin}?invite=${id}`;
      return inviteLink;
    } catch (error) {
      log(
        `ERROR: Не удалось сгенерировать ссылку-приглашение для чата: ${error}`,
      );
      return null;
    }
  }, []);
  const getUserInviteChat = useCallback(async (inviteToken: string) => {
    try {
      const res = await chatApi.getUserInviteChat(inviteToken);
      return res?.userId;
    } catch (error) {
      return null;
    }
  }, []);

  return {
    activeChatId,
    activeChat,
    otherUser,
    activeChatMessages,
    pagination,
    chatContainer,
    loaderRef,
    chatContainerRef,
    handleSendMessage,
    handleDeleteMessage,
    handleActionCreateChat,
    decryptedMessages,
    decryptedMessage,
    generateChatInviteLink,
    getUserInviteChat,
  };
};
