"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon, PhoneIcon, UserIcon } from "./icons";

interface NewContactProps {
  onClose: () => void;
}

export const NewContact: React.FC<NewContactProps> = ({ onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => {
    setIsAnimating(true);

    return () => setIsAnimating(false);
  }, []);

  return (
    <div className="h-full bg-gray-800 flex flex-col p-1 pr-0">
      <div className="p-4 border-b border-gray-700 flex items-center gap-4">
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <ArrowLeftIcon />
        </button>
        <h2 className="text-xl font-bold">Новый контакт</h2>
      </div>
      <div
        className={`p-4 space-y-4 transition-all duration-500 ${
          isAnimating
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0"
        }`}
      >
        <div className="flex items-center gap-4">
          <UserIcon className="text-gray-400" />
          <input
            type="text"
            placeholder="Имя"
            className="w-full bg-transparent border-b border-gray-600 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Фамилия"
            className="w-full bg-transparent border-b border-gray-600 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 ml-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <PhoneIcon className="text-gray-400" />
          <div className="flex gap-4 w-full">
            <input
              type="text"
              placeholder="Страна"
              defaultValue="RU +7"
              className="w-1/4 bg-transparent border-b border-gray-600 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
            <input
              type="text"
              placeholder="Телефон"
              className="w-3/4 bg-transparent border-b border-gray-600 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
