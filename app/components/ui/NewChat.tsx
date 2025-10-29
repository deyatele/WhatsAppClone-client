"use client";

import { useState } from "react";
import { useModal } from "../../components/modal/ModalContext";
import { QrCodeModalContent } from "../../components/modal/QrCodeModalContent";
import { useChat } from "../../lib/hooks/useChat";
import { ArrowLeftIcon, NewContactIcon, QrCodeIcon, SearchIcon } from "./icons";
import { NewContact } from "./NewContact";

interface NewChatProps {
  onClose: () => void;
}

export const NewChat: React.FC<NewChatProps> = ({ onClose }) => {
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [isNewContactAnimate, setIsNewContactAnimate] = useState(false);
  const { openModal } = useModal();
  const { generateChatInviteLink } = useChat();

  const handleClickOpen = () => {
    setIsNewContactOpen(true);
    setIsNewContactAnimate(true);
  };

  const handleClickClose = () => {
    setIsNewContactAnimate(false);
    setTimeout(() => {
      setIsNewContactOpen(false);
    }, 300);
  };

  const handleClickQRcode = async (
    e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
  ) => {
    e.stopPropagation();

    const inviteLink = await generateChatInviteLink();

    if (inviteLink) {
      openModal(<QrCodeModalContent inviteLink={inviteLink} />);
    } else {
      console.error("Не удалось сгенерировать ссылку-приглашение.");
    }
  };

  return (
    <div className="relative h-full">
      <div className="h-full bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center gap-4">
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <ArrowLeftIcon />
          </button>
          <h2 className="text-xl font-bold">Новый чат</h2>
        </div>
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Поиск по имени или номеру"
              className="w-full bg-gray-700 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 border border-transparent focus:border-green-500"
            />
          </div>
        </div>
        <div
          onClick={() => handleClickOpen()}
          className="p-4 flex items-center justify-between hover:bg-gray-700 pr-6 cursor-pointer"
        >
          <div className="flex items-center gap-4 text-white p-2 rounded-md ">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <NewContactIcon />
            </div>
            <span>Новый контакт</span>
          </div>
          <div className="group relative">
            <button
              className="text-gray-400 hover:text-white cursor-pointer"
              onClick={handleClickQRcode}
            >
              <QrCodeIcon height={28} width={28} />
            </button>
            <span className="absolute z-50 top-12 right-3 opacity-0 group-hover:opacity-100 transition-opacity  duration-0 group-hover:delay-300 rounded bg-gray-800 p-2 text-xs text-white whitespace-nowrap">
              Создать временную ссылку-приглашение
            </span>
          </div>
        </div>
      </div>
      {isNewContactOpen && (
        <div
          className={`absolute inset-0 transition-transform duration-300 ${
            isNewContactAnimate ? "translate-x-0" : "-translate-x-full"
          } z-20`}
        >
          <NewContact onClose={handleClickClose} />
        </div>
      )}
    </div>
  );
};
