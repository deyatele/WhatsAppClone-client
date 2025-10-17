"use client";

import { useEffect, useRef, useState } from "react";
import { formaterDate } from "../lib/utils";
import { webRTCManager } from "../lib/WebRTCManager";
import type { ChatParticipant, Message } from "../types";

interface ChatHeaderProps {
  otherUser: ChatParticipant | undefined;
  lastMessage: Message | undefined;
}

export const ChatHeader = ({ otherUser, lastMessage }: ChatHeaderProps) => {
  const [isCallDropdownOpen, setIsCallDropdownOpen] = useState(false);

  const callDropdownRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        callDropdownRef.current &&
        !callDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCallDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInitiateCall = async () => {
    if (!otherUser?.id) return;
    await webRTCManager.initiateCall(otherUser.id);
  };

  return (
    <div className="p-3 border-b border-gray-700 bg-gray-800 flex items-center">
      <div>
        <h2 className="text-xl font-bold">{otherUser?.name || "Чат"}</h2>
        {lastMessage && (
          <p className="text-xs text-gray-400">
            был(-а) в {formaterDate(lastMessage.createdAt)}
          </p>
        )}
      </div>
      <div className="ml-auto flex items-center gap-x-2 text-gray-400">
        <div className="relative" ref={callDropdownRef}>
          <button
            onClick={() => setIsCallDropdownOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-700 hover:text-white flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 ml-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {isCallDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  handleInitiateCall();
                  setIsCallDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5 mr-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                Видеозвонок
              </button>
              <button
                onClick={() => {
                  handleInitiateCall();
                  setIsCallDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5 mr-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z"
                  />
                </svg>
                Аудиозвонок
              </button>
            </div>
          )}
        </div>
        <button
          className="p-2 rounded-full hover:bg-gray-700 hover:text-white"
          title="Поиск по чату"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
        <button
          className="p-2 rounded-full hover:bg-gray-700 hover:text-white"
          title="Другие опции"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
            />
          </svg>
        </button>
      </div>
    </div>

    // <div className="p-3 border-b border-gray-700 bg-gray-800 flex items-center">
    //   <div>
    //     <h2 className="text-xl font-bold text-white">
    //       {otherUser?.name || "Чат"}
    //     </h2>
    //     {lastMessage && (
    //       <p className="text-xs text-gray-400">
    //         был(-а) в {formaterDate(lastMessage.createdAt)}
    //       </p>
    //     )}
    //   </div>
    // </div>
  );
};
