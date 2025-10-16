"use client";

import type { FC } from "react";
import { useChatStore } from "../lib/store";
import { webRTCManager } from "../lib/WebRTCManager";
import { VideoPlayer } from "./VideoPlayer";

interface CallOverlayProps {
  participantName?: string;
}

export const CallOverlay: FC<CallOverlayProps> = ({
  participantName = "Собеседник",
}) => {
  const { callState, localStream, remoteStream } = useChatStore();

  const handleDecline = () => {
    webRTCManager.closeConnection();
  };

  const handleAccept = () => {
    webRTCManager.answerCall();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col items-center justify-between p-8">
      <div className="text-center text-white">
        <div className="w-24 h-24 rounded-full mx-auto border-2 border-white bg-gray-600"></div>
        <h2 className="text-3xl mt-4">{participantName}</h2>
        <p className="text-gray-300">
          {callState === "incoming" ? "Входящий звонок..." : "Соединение..."}
        </p>
      </div>

      <div className="w-full max-w-4xl h-3/5 bg-black rounded-lg flex items-center justify-center overflow-hidden">
        <VideoPlayer stream={remoteStream} muted={false} />
      </div>

      <div className="absolute bottom-32 right-8 w-64 h-40 bg-black rounded-lg border-2 border-gray-600 flex items-center justify-center overflow-hidden">
        <VideoPlayer stream={localStream} muted={true} />
      </div>
      {callState === "incoming" ? (
        <div className="flex justify-center items-center gap-x-8">
          <button
            type="button"
            onClick={handleDecline}
            className="flex flex-col items-center text-white gap-y-2"
          >
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-8 h-8"
              >
                <title>round</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6.75v-1.5a2.25 2.25 0 00-2.25-2.25H10.5a2.25 2.25 0 00-2.25 2.25v1.5m3 13.5-3-3m0 0l-3 3m3-3v-6m-1.5 9H5.625c-.621 0-1.125-.504-1.125-1.125V10.125c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125H16.5"
                />
              </svg>
            </div>
            <p>Отклонить</p>
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex flex-col items-center text-white gap-y-2"
          >
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-8"
              >
                <title>round</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z"
                />
              </svg>
            </div>
            <p>Принять</p>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl flex justify-center items-center gap-x-6">
          <button
            type="button"
            onClick={() => webRTCManager.toggleVideo()}
            className="p-4 bg-gray-600 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-8 h-8"
            >
              <title>round</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 1.263c.11.11.167.25.167.402v6.036c0 .152-.057.292-.167.402l-1.263 1.263a1.5 1.5 0 01-1.061.44H4.465a1.5 1.5 0 01-1.06-.44l-1.263-1.263A1.5 1.5 0 012 16.036V9.964c0-.152.057-.292.167-.402l1.263-1.263c.11-.11.25-.167.402-.167h10.928c.152 0 .292.057.402.167z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => webRTCManager.toggleAudio()}
            className="p-4 bg-gray-600 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-8 h-8"
            >
              <title>button</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => webRTCManager.switchCamera()}
            className="p-4 bg-gray-600 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-8 h-8"
            >
              <title>button</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => webRTCManager.toggleScreenShare()}
            className="p-4 bg-gray-600 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-8 h-8"
            >
              <title>button</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0h-3.375m0 0a2.25 2.25 0 01-2.25 2.25H10.5a2.25 2.25 0 01-2.25-2.25m0 0H3"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => webRTCManager.closeConnection()}
            className="p-4 bg-red-600 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-8 h-8"
            >
              <title>button</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6.75v-1.5a2.25 2.25 0 00-2.25-2.25H10.5a2.25 2.25 0 00-2.25 2.25v1.5m3 13.5-3-3m0 0l-3 3m3-3v-6m-1.5 9H5.625c-.621 0-1.125-.504-1.125-1.125V10.125c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125H16.5"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
