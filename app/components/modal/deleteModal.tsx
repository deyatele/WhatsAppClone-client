import { useState } from "react";

interface DeleteModalProps {
  isCurrentUser: boolean;
  onClose: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: (forAll: boolean) => void;
}

export function DeleteModal({
  isCurrentUser,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}: DeleteModalProps) {
  const [forEveryone, setForEveryone] = useState(false);

  if (!isCurrentUser) {
    return (
      <div className="p-4 text-white">
        <h2 className="text-lg font-bold mb-4">Удалить сообщение?</h2>
        <div className="flex justify-end space-x-3 mt-4">
          <button
            className="px-6 py-2 rounded-full bg-green-500 text-white hover:bg-green-700 transition-colors duration-200"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            className="px-6 py-2 rounded-full text-green-500 border border-green-500 hover:bg-green-500 hover:text-white transition-colors duration-200"
            onClick={() => {
              onDeleteForMe();
              onClose();
            }}
          >
            Удалить у меня
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-lg font-bold mb-4">Удалить сообщение?</h2>

      <label className="flex items-center mb-6 cursor-pointer">
        <input
          type="checkbox"
          className="sr-only"
          checked={forEveryone}
          onChange={(e) => setForEveryone(e.target.checked)}
        />
        <div
          className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-2 transition-all duration-200 ${
            forEveryone ? "bg-green-500 border-green-500" : "border-gray-400"
          }`}
        >
          {forEveryone && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <span>Удалить сообщение у всех</span>
      </label>

      <div className="flex justify-end space-x-3 mt-4">
        <button
          className="px-6 py-2 rounded-full bg-green-500 text-white hover:bg-green-700 transition-colors duration-200"
          onClick={onClose}
        >
          Отмена
        </button>
        <button
          className="px-6 py-2 rounded-full text-green-500 border border-green-500 hover:bg-green-500 hover:text-white ransition-colors duration-200"
          onClick={() => {
            onDeleteForEveryone(forEveryone);
            onClose();
          }}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
