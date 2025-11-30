"use client";

import { useState } from "react";
import { addChat, nameProgect } from "../../constants/constant.project";
import { Dropdown } from "../ui/Dropdown";
import {
  CheckSquareIcon,
  LogoutIcon,
  MoreVerticalIcon,
  NewChatIcon,
  NewGroupIcon,
  SearchIcon,
  StarIcon,
} from "../ui/icons";
import { NewChat } from "../ui/NewChat";

interface ChatListHeaderProps {
  loading: boolean;
  handleLogout: () => void;
  setIsNewChatOpen: (isOpen: boolean) => void;
  isNewChatOpen: boolean;
}

export const ChatListHeader = ({
  loading,
  handleLogout,
  setIsNewChatOpen,
  isNewChatOpen,
}: ChatListHeaderProps) => {
  const [disabled] = useState(true); // Заглушка для неактивных функций

  return (
    <>
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold cursor-default whitespace-nowrap">
            {nameProgect}
          </h2>
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
                {addChat}
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
              <li role="separator" className="border-t border-gray-600 my-1" />
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

      <div
        className={`absolute inset-0 transition-transform duration-300 ${
          isNewChatOpen ? "translate-x-0" : "-translate-x-full"
        } z-10`}
      >
        <NewChat onClose={() => setIsNewChatOpen(false)} />
      </div>
    </>
  );
};
