"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface QrCodeModalContentProps {
  inviteLink: string;
}

export const QrCodeModalContent = ({ inviteLink }: QrCodeModalContentProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center space-y-4">
      <h2 className="text-xl font-bold text-white">Приглашение в чат</h2>
      <div className="p-2 bg-white rounded-lg">
        <QRCodeSVG value={inviteLink} size={256} level="H" />
      </div>
      <p className="text-sm text-gray-300 text-center">
        Отсканируйте QR-код или скопируйте ссылку:
      </p>
      <div className="flex items-center space-x-2 w-full">
        <input
          type="text"
          readOnly
          value={inviteLink}
          className="flex-grow p-2 text-sm bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {copied ? "Скопировано!" : "Копировать"}
        </button>
      </div>
    </div>
  );
};
