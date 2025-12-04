"use client";

import { useEffect, useState } from "react";

import {
  getMessageStatus,
  getStatusColor,
  type MessageStatus,
} from "../../lib/crypto/messageStatus";
import { useDateFormatter } from "../../lib/hooks/useDateFormatter";
import type { Message as MessageType } from "../../types";
import { DeleteModal } from "../modal/deleteModal";
import { useModal } from "../modal/ModalContext";
import { UserAvatar } from "../ui/UserAvatar";
import { MessageMarkdownDisplay } from "./MessageMarkdownDisplay";

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
  handleDeleteMessage: (id: string, flag?: boolean) => void;
}

export const Message = ({
  message,
  isCurrentUser,
  handleDeleteMessage,
}: MessageProps) => {
  const { openModal, closeModal } = useModal();
  const [status, setStatus] = useState("pending");
  const { format } = useDateFormatter();

  useEffect(() => {
    const s = getMessageStatus(message.id);
    if (s) setStatus(s);
  }, [message.id]);

  const handleDeleteClick = () => {
    openModal(
      <DeleteModal
        isCurrentUser={isCurrentUser}
        onClose={closeModal}
        onDeleteForMe={() => handleDeleteMessage(message.id)}
        onDeleteForEveryone={(flag) => handleDeleteMessage(message.id, flag)}
      />,
    );
  };

  const color = getStatusColor(status as MessageStatus);

  return (
    <div
      key={message.id}
      className={`relative flex flex-col ${
        isCurrentUser ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
      >
        {!isCurrentUser && (
          <div className="mr-1">
            <UserAvatar user={message.sender} size="sm" />
          </div>
        )}
        <div
          className={`relative p-2 group rounded-lg max-w-full sm:max-w-[66%] ${
            isCurrentUser
              ? "bg-green-800 mr-2 rounded-tr-none"
              : "bg-gray-700 ml-2 rounded-tl-none"
          } text-white`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0 w-2 h-[13px] z-10 block ${
              isCurrentUser
                ? "text-green-800 mr-2 right-[-16px] transform scale-x-[-1]"
                : "text-gray-700 ml-2 -left-[16px] transform"
            }`}
          >
            <svg viewBox="0 0 8 13" height="13" width="8" x="0px" y="0px">
              <path
                opacity="0.13"
                fill="#0000000"
                d="M1.533,3.568L8,12.193V1H2.812C1.042,1,0.474,2.156,1.533,3.568z"
              ></path>
              <path
                fill="currentColor"
                d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"
              ></path>
            </svg>
          </span>
          <button
            onClick={handleDeleteClick}
            className={`absolute top-1 text-white cursor-pointer flex items-center justify-center text-[16px] ${
              isCurrentUser ? "right-2" : "right-3"
            } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
            aria-label="Удалить сообщение"
          >
            X
          </button>
          <div className="flex flex-col p-2 pr-4">
            {!isCurrentUser && (
              <p className="text-sm font-bold text-green-300 pr-3 self-start">
                {message.sender?.name || "User"}
              </p>
            )}
            <div className="break-words max-w-full">
              <MessageMarkdownDisplay content={message.message} />
            </div>
            <p className="text-xs text-right text-gray-400 inline-block relative -bottom-3 -right-3">
              {format(message.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color }}>
        <span>{status}</span>
        {(status === "failed" || status === "undelivered") && (
          <button
            onClick={() => console.log("Повторная отправка")}
            className="underline text-xs hover:text-white"
          >
            Повторить
          </button>
        )}
      </div>
    </div>
  );
};
