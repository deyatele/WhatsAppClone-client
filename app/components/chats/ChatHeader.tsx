"use client";

import { useDateFormatter } from "../../lib/hooks/useDateFormatter";
import { useChatStore } from "../../lib/store";
import { webRTCManager } from "../../lib/WebRTCManager";
import type { ChatParticipant, Message } from "../../types";
import { Dropdown } from "../ui/Dropdown";
import {
  HamburgerIcon,
  MoreVerticalIcon,
  SearchIcon,
  TelephoneIcon,
  VideoCameraIcon,
} from "../ui/icons";

interface ChatHeaderProps {
  otherUser: ChatParticipant | undefined;
  lastMessage: Message | undefined;
}

export const ChatHeader = ({ otherUser, lastMessage }: ChatHeaderProps) => {
  const toggleChatList = useChatStore((state) => state.toggleChatList);
  const { format } = useDateFormatter();
  const handleInitiateCall = async () => {
    if (!otherUser?.id) return;
    await webRTCManager.initiateCall(otherUser.id);
  };

  return (
    <div className="p-3 border-b border-gray-700 bg-gray-800 flex items-center">
      <button
        className="p-2 rounded-full hover:bg-gray-700 hover:text-white md:hidden"
        onClick={toggleChatList}
        title="Открыть список чатов"
      >
        <HamburgerIcon className="w-6 h-6" />
      </button>
      <div className="flex flex-col">
        <h2 className="text-xl font-bold">{otherUser?.name || "Чат"}</h2>
        {lastMessage && (
          <p className="text-xs text-gray-400">
            был(-а) в {format(lastMessage.createdAt)}
          </p>
        )}
      </div>
      <div className="ml-auto flex items-center gap-x-2 text-gray-400">
        <Dropdown
          align="right"
          trigger={
            <button className="p-2 rounded-full hover:bg-gray-700 hover:text-white flex items-center">
              <VideoCameraIcon className="w-6 h-6" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-5 h-5 ml-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          }
        >
          <li>
            <button
              onClick={handleInitiateCall}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 flex items-center"
            >
              <VideoCameraIcon className="w-5 h-5 mr-3" />
              Видеозвонок
            </button>
          </li>
          <li>
            <button
              onClick={handleInitiateCall}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 flex items-center"
            >
              <TelephoneIcon className="w-5 h-5 mr-3" />
              Аудиозвонок
            </button>
          </li>
        </Dropdown>
        <button
          className="p-2 rounded-full hover:bg-gray-700 hover:text-white hidden md:block"
          title="Поиск по чату"
        >
          <SearchIcon className="w-6 h-6" />
        </button>
        <Dropdown
          align="right"
          trigger={
            <button
              className="p-2 rounded-full hover:bg-gray-700 hover:text-white"
              title="Дополнительно"
            >
              <MoreVerticalIcon className="w-6 h-6" />
            </button>
          }
        >
          <li className="md:hidden">
            <button
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 flex items-center"
              title="Поиск по чату"
            >
               <SearchIcon className="w-4 h-4 mr-2" />
              Поиск
            </button>
          </li>
          {/* Другие пункты меню можно добавить здесь */}
        </Dropdown>
      </div>
    </div>
  );
};
