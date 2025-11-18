"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

// React imports
import { useCallback, useEffect, useState } from "react";

// Internal modules
import { logoutAction } from "../lib/serverActions";
import { useChatStore } from "../lib/store";
import { formaterDate } from "../lib/utils";
// Types
import type { Chat } from "../types";
// Components
import { LogPanel } from "./LogPanel";
import PasswordModale from "./modal/passwordModal";
import { useUser } from "./UserProvider";
import { Dropdown } from "./ui/Dropdown";
import {
  CheckSquareIcon,
  LogoutIcon,
  MoreVerticalIcon,
  NewChatIcon,
  NewGroupIcon,
  SearchIcon,
  StarIcon,
} from "./ui/icons";
import Modal from "./ui/Modal";
import { NewChat } from "./ui/NewChat";

export const ChatList = () => {
  const { chats, setActiveChatId, activeChatId, password, setPassword } =
    useChatStore();
  const { userId } = useUser();
  const router = useRouter();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePasswordSubmit = useCallback(
    async (newPassword: string) => {
      if (!newPassword.trim()) {
        setError("Поле не может быть пустым");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const response = await fetch("/api/auth/validate-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newPassword }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Неверный пароль");
        }

        setPassword(newPassword);
        setIsPasswordModalOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка");
      } finally {
        setLoading(false);
      }
    },
    [setPassword],
  );

  useEffect(() => {
    if (isMounted && !password) {
      setIsPasswordModalOpen(true);
    }
  }, [isMounted, password]);

  const disabled = true; // Заглушка для неактивных функций

  const handleLogout = async () => {
    setLoading(true);
    await logoutAction();
    router.push("/login");
  };

  const getOtherParticipant = (chat: Chat) => {
    if (!userId) return null;
    return chat.participants.find((p) => p.user.id !== userId)?.user;
  };

  return (
    <div className="relative h-full">
      <div className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold cursor-default">Расскажи и ...</h2>
            <div className="flex items-center gap-3">
              <div className="group relative">
                <button
                  type="button"
                  className="flex justify-center items-center p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
                  onClick={() => setIsNewChatOpen(true)}
                >
                  <NewChatIcon />
                </button>
                <span className="absolute z-50 top-12 right-3 opacity-0 group-hover:opacity-100 transition-opacity  duration-0 group-hover:delay-300 rounded bg-gray-800 p-2 text-xs text-white whitespace-nowrap">
                  Добавить чат
                </span>
              </div>
              <Dropdown
                align="left"
                trigger={
                  <button
                    type="button"
                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center"
                  >
                    <MoreVerticalIcon />
                  </button>
                }
              >
                <li>
                  <button
                    disabled={disabled}
                    className={`flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full ${disabled && "cursor-not-allowed *:opacity-50"}`}
                  >
                    <NewGroupIcon className="w-5 h-5 mr-3" />
                    <span>Новая группа</span>
                  </button>
                </li>
                <li>
                  <button
                    disabled={disabled}
                    className={`flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full ${disabled && "cursor-not-allowed *:opacity-50"}`}
                  >
                    <StarIcon className="w-5 h-5 mr-3" />
                    <span>Избранные сообщения</span>
                  </button>
                </li>
                <li>
                  <button
                    disabled={disabled}
                    className={`flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full ${disabled && "cursor-not-allowed *:opacity-50"}`}
                  >
                    <CheckSquareIcon className="w-5 h-5 mr-3" />
                    <span>Выбрать чаты</span>
                  </button>
                </li>
                <li
                  role="separator"
                  className="border-t border-gray-600 my-1"
                />
                <li>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 ${loading ? "cursor-none" : "cursor-pointer"}`}
                    disabled={loading}
                  >
                    <LogoutIcon className="w-5 h-5 mr-3" />
                    <span>Выйти</span>
                  </button>
                </li>
              </Dropdown>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Поиск или новый чат"
              className="w-full bg-gray-700 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-y flex-1">
          {chats.length > 0 ? (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              const lastMessage = chat.messages?.[0];
              const isActive = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  className={`p-4 border-b border-gray-700 ${
                    isActive
                      ? "bg-gray-600"
                      : "cursor-pointer hover:bg-gray-700"
                  }`}
                  onClick={() => setActiveChatId(chat.id)}
                >
                  <div className="flex gap-3 items-center">
                    <div className="size-14 flex-none overflow-hidden rounded-full bg-gray-700 flex items-center justify-center">
                      {otherUser?.avatar ? (
                        <Image
                          src={otherUser.avatar}
                          alt={otherUser?.name ?? "Avatar"}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-2xl">
                          {otherUser?.name?.at(0)?.toUpperCase() ?? "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col mb-1 w-full">
                      <div className="flex justify-between items-center ">
                        <p className="font-bold">
                          {otherUser?.name || "Неизвестный"}
                        </p>
                        <p className="text-sm text-gray-400 whitespace-nowrap ml-2">
                          {lastMessage && formaterDate(lastMessage.createdAt)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center ">
                        <p className="text-sm text-gray-400 max-w-xs truncate">
                          {lastMessage?.message || "Пока нет сообщений"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-400">
              <p>Нет доступных чатов.</p>
            </div>
          )}
        </div>
        <div className="pb-15">
          <LogPanel />
        </div>
      </div>
      <Modal isOpen={isPasswordModalOpen} onClose={() => {}}>
        <PasswordModale
          handleAction={handlePasswordSubmit}
          error={error}
          loading={loading}
        />
      </Modal>
      <div
        className={`absolute inset-0 transition-transform duration-300 ${
          isNewChatOpen ? "translate-x-0" : "-translate-x-full"
        } z-10`}
      >
        <NewChat onClose={() => setIsNewChatOpen(false)} />
      </div>
    </div>
  );
};
