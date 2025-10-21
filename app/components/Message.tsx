"use client";

import Image from "next/image";
import { formaterDate } from "../lib/utils";
import type { Message as MessageType } from "../types";
import { DeleteModal } from "./modal/deleteModal";
import { useModal } from "./modal/ModalContext";

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

  return (
    <div
      key={message.id}
      className={`relative flex  ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      {!isCurrentUser && (
        <div className="size-8 overflow-hidden flex  justify-center items-center rounded-full mr-1 bg-gray-700 ">
          {message?.sender?.avatar ? (
            <Image
              src={message.sender.avatar}
              alt={message?.sender?.name ?? "Avatar"}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <span>{message?.sender?.name?.at(0)?.toUpperCase() ?? "U"}</span>
          )}
        </div>
      )}
      <div
        className={`relative p-2  group rounded-lg  max-w-md ${isCurrentUser ? "bg-green-800 mr-2 rounded-tr-none" : "bg-gray-700 ml-2 rounded-tl-none"} text-white`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0 w-2 h-[13px] z-50 block ${isCurrentUser ? "text-green-800  mr-2 right-[-16] transform scale-x-[-1]" : "text-gray-700 ml-2 -left-[16px] transform "}`}
        >
          <svg viewBox="0 0 8 13" height="13" width="8" x="0px" y="0px">
            <title>tail-in</title>
            <path
              opacity="0.13"
              fill="#0000000"
              d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"
            ></path>
            <path
              fill="currentColor"
              d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"
            ></path>
          </svg>
        </span>
        <button
          onClick={handleDeleteClick}
          className={`absolute top-1  text-white cursor-pointer flex items-center justify-center text-[16px] ${isCurrentUser ? "right-2" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
          aria-label="Удалить сообщение"
        >
          X
        </button>
        <div className="flex flex-col p-2  pr-4 ">
          {!isCurrentUser && (
            <p className="text-sm font-bold text-green-300 pr-3 self-start">
              {message.sender?.name || "User"}
            </p>
          )}
          <p className="break-words">{message.content}</p>
          <p className="text-xs text-right text-gray-400 inline-block relative -bottom-3 -right-3">
            {formaterDate(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};
