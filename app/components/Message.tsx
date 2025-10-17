"use client";

import { useState } from "react";
import { useModal } from "../lib/ModalContext";
import { formaterDate } from "../lib/utils";
import type { Message as MessageType } from "../types";

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
}

export const Message = ({ message, isCurrentUser }: MessageProps) => {
  const { openModal, closeModal } = useModal();
  const [deleteForEveryoneChecked, setDeleteForEveryoneChecked] =
    useState(false);

  const deleteForMe = () => {
    console.log("Удалить у меня", message.id);
    closeModal();
    // TODO: Implement actual deletion for self
  };

  const deleteForEveryone = () => {
    console.log(
      "Удалить у всех",
      message.id,
      "Удалить файл:",
      deleteForEveryoneChecked,
    );
    closeModal();
    // TODO: Implement actual deletion for everyone, considering deleteForEveryoneChecked
  };

  const handleDeleteClick = () => {
    if (isCurrentUser) {
      openModal(
        <div className="p-4 text-white">
          <h2 className="text-lg font-bold mb-4">Удалить сообщение?</h2>
          <label className="flex items-center mb-6 cursor-pointer">
            <input
              type="checkbox"
              className="hidden"
              checked={deleteForEveryoneChecked}
              onChange={() =>
                setDeleteForEveryoneChecked(!deleteForEveryoneChecked)
              }
            />
            <div
              className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-2 transition-all duration-200
                ${deleteForEveryoneChecked ? "bg-green-500 border-green-500" : "border-gray-400"}`}
            >
              {deleteForEveryoneChecked && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              )}
            </div>
            <span>Удалить файл с вашего телефона</span>
          </label>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              className="px-6 py-2 rounded-full text-green-500 border border-green-500 hover:bg-green-500 hover:text-white transition-colors duration-200"
              onClick={closeModal}
            >
              Отмена
            </button>
            <button
              className="px-6 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors duration-200"
              onClick={deleteForEveryone}
            >
              Удалить у всех
            </button>
          </div>
        </div>,
      );
    } else {
      openModal(
        <div className="p-4 text-white">
          <h2 className="text-lg font-bold mb-4">Удалить сообщение?</h2>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              className="px-6 py-2 rounded-full text-green-500 border border-green-500 hover:bg-green-500 hover:text-white transition-colors duration-200"
              onClick={closeModal}
            >
              Отмена
            </button>
            <button
              className="px-6 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors duration-200"
              onClick={deleteForMe}
            >
              Удалить у меня
            </button>
          </div>
        </div>,
      );
    }
  };

  return (
    <div
      key={message.id}
      className={`relative flex group ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative p-2  rounded-lg  max-w-md ${isCurrentUser ? "bg-green-800 mr-2 rounded-tr-none" : "bg-gray-700 ml-2 rounded-tl-none"} text-white`}
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
          className={`absolute top-1  text-white cursor-pointer flex items-center justify-center 
            text-[16px] ${isCurrentUser ? "right-2" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
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
