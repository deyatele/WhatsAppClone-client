"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
    addConnectedChatId,
    removeConnectedChatId,
  } = store;
  const activeChatMessages = messages[activeChatId || ""] || [];
  const messageCount = activeChatMessages.length;

  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [_userScrolled, setUserScrolled] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const scrollStateRef = useRef({
    oldScrollHeight: 0,
    shouldAdjustScroll: false,
  });
  const _visibleMessageCountRef = useRef(0);
  const addMessagesToStart = useChatStore((s) => s.addMessagesToStart);
  const setInitialMessages = useChatStore((s) => s.setInitialMessages);
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

  const loadMessages = useCallback(
    async (isInitial = false) => {
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
        const cursor = isInitial
          ? undefined
          : (paginationWithCursor.cursor ?? undefined);
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

        if (isInitial) {
          const sortedMessages = [...messages].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          setInitialMessages(activeChatId, sortedMessages);
        } else {
          const sortedMessages = [...messages].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          addMessagesToStart(activeChatId, sortedMessages);
        }

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

  const decryptedMessage = useCallback(
    async (
      newMessage: MessageResponse,
      /*  userId: string,
    password: string, */
    ) => {
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
    if (!isInitialLoadComplete) return;

    const handleScroll = () => {
      const chatContainer = chatContainerRef.current;
      if (!chatContainer) return;

      // Устанавливаем флаг, что пользователь скроллил
      setUserScrolled(true);

      // Определяем, находится ли пользователь внизу чата
      // Учитываем, что контейнер инвертирован (flex-col-reverse),
      // поэтому "внизу" означает scrollTop близок к 0
      const threshold = 10; // порог в пикселях
      const isAtBottom = chatContainer.scrollTop <= threshold;
      setIsUserAtBottom(isAtBottom);
    };

    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
    }

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
            const chatContainer = chatContainerRef.current;
            if (chatContainer) {
              // Сохраняем текущую высоту для корректного восстановления позиции
              scrollStateRef.current = {
                oldScrollHeight: chatContainer.scrollHeight,
                shouldAdjustScroll: true,
              };
              loadMessages();
            }
          }
        }
      },
      {
        root: chatContainerRef.current,
        threshold: 0.1,
      },
    );

    const loaderElement = loaderRef.current;
    if (loaderElement) {
      observer.observe(loaderElement);
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", handleScroll);
      }
      if (loaderElement) {
        observer.unobserve(loaderElement);
      }
    };
  }, [isInitialLoadComplete, loadMessages, activeChatId]);

  const loadInitialMessages = useCallback(() => {
    if (activeChatId) {
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

      setIsInitialLoadComplete(false);
      useChatStore.getState().setIsLoadingMessages(true);

      // Добавляем проверку, чтобы избежать повторной загрузки тех же сообщений
      const existingMessages =
        useChatStore.getState().messages[activeChatId] || [];
      if (existingMessages.length > 0) {
        // Если сообщения уже есть, просто устанавливаем флаг завершения загрузки
        setIsInitialLoadComplete(true);
        // Прокручиваем к последним сообщениям
        setTimeout(() => {
          const chatContainer = chatContainerRef.current;
          if (chatContainer) {
            requestAnimationFrame(() => {
              chatContainer.scrollTop = 0;
            });
          }
        }, 50);
        useChatStore.getState().setIsLoadingMessages(false);
        return;
      }

      // Даже если сообщения есть в кэше, все равно нужно выполнить загрузку для обновления/расшифровки
      loadMessages(true)
        .then(() => {
          setIsInitialLoadComplete(true);
          // После загрузки сообщений прокручиваем к последнему сообщению
          setTimeout(() => {
            const chatContainer = chatContainerRef.current;
            if (chatContainer) {
              // Учитываем, что контейнер инвертирован (flex-col-reverse), поэтому скроллим к 0
              // Добавляем небольшую задержку для гарантии завершения рендера
              requestAnimationFrame(() => {
                chatContainer.scrollTop = 0;
              });
            }
          }, 50); // Уменьшаем таймаут для более быстрого скролла
        })
        .finally(() => {
          useChatStore.getState().setIsLoadingMessages(false);
        });
    }
  }, [activeChatId, loadMessages]);

  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  useIsomorphicLayoutEffect(() => {
    if (messageCount === 0) return;

    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const { oldScrollHeight, shouldAdjustScroll } = scrollStateRef.current;

    if (shouldAdjustScroll) {
      // Восстанавливаем позицию скролла после подгрузки сообщений
      const newScrollHeight = chatContainer.scrollHeight;
      chatContainer.scrollTop =
        newScrollHeight - oldScrollHeight + chatContainer.scrollTop;
      scrollStateRef.current.shouldAdjustScroll = false;
    } else {
      // Автоматический скролл к последнему сообщению если пользователь находится внизу
      if (isUserAtBottom) {
        // Если пользователь находится внизу, скроллим к последнему сообщению
        // Учитываем, что контейнер инвертирован (flex-col-reverse), поэтому скроллим к 0
        chatContainer.scrollTop = 0;
      }
    }
  }, [messageCount, isUserAtBottom]);

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
      const handleNewMessage = async (message: MessageResponse) => {
        try {
          const decodedMessage = await decryptedMessage(message);
          if (!decodedMessage) return;

          // Проверяем, находится ли пользователь внизу чата до добавления сообщения
          const chatContainer = chatContainerRef.current;
          let wasAtBottom = false;
          if (chatContainer) {
            const threshold = 10;
            wasAtBottom = chatContainer.scrollTop <= threshold;
          }

          // Добавляем сообщение в конец списка
          useChatStore.getState().addMessageToEnd(decodedMessage);

          // Если пользователь был внизу, скроллим к новому сообщению
          // (только для сообщений от других пользователей)
          if (
            wasAtBottom &&
            chatContainer &&
            decodedMessage.sender.id !== userId
          ) {
            setTimeout(() => {
              // Учитываем, что контейнер инвертирован (flex-col-reverse), поэтому скроллим к 0
              chatContainer.scrollTop = 0;
            }, 0);
          }
        } catch (error) {
          log(`ERROR: ${error}`);
        }
      };

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
    decryptedMessage,
    userId,
  ]);

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
    encryptMessageForTwo(newMessage, pubKeyUser, pubKeyOther)
      .then((enMes) => {
        socket.emit("message:send", { chatId: activeChatId, text: enMes });
        setNewMessage("");

        // После отправки сообщения пользователя, всегда скроллим к последнему сообщению
        setTimeout(() => {
          const chatContainer = chatContainerRef.current;
          if (chatContainer) {
            chatContainer.scrollTop = 0;
            setIsUserAtBottom(true);
            setUserScrolled(false); // Сбрасываем флаг, так как пользователь намеренно перешел вниз
          }
        }, 0);
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
      const { userId } = await chatApi.getUserInviteChat(inviteToken);
      return userId;
    } catch (error) {
      log(`ERROR: ${error}`);
    }
  }, []);

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
    handleActionCreateChat,
    decryptedMessages,
    decryptedMessage,
    generateChatInviteLink,
    getUserInviteChat,
  };
};
