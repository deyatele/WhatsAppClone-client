import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChatStore } from "../lib/store";
import { webRTCManager } from "../lib/WebRTCManager";
import { VideoPlayer } from "./ui/VideoPlayer";

interface CallOverlayProps {
  participantName?: string;
}

export const CallOverlay: FC<CallOverlayProps> = ({
  participantName = "Собеседник",
}) => {
  const { callState, localStream, remoteStream } = useChatStore();
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Динамически задаем высоту контейнера, чтобы обойти баги мобильных браузеров
  useLayoutEffect(() => {
    const setHeight = () => {
      if (overlayRef.current) {
        overlayRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    window.addEventListener("resize", setHeight);
    setHeight(); // Устанавливаем начальную высоту

    return () => window.removeEventListener("resize", setHeight);
  }, []);

  const handleDecline = () => {
    webRTCManager.closeConnection();
  };

  const handleAccept = () => {
    webRTCManager.answerCall();
  };

  const handleSwapStreams = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation(); // Предотвращаем всплытие, чтобы не скрыть/показать контролы
    setIsSwapped((prev) => !prev);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isControlsVisible && callState !== "incoming") {
      timer = setTimeout(() => {
        setIsControlsVisible(false);
      }, 10000); // 10 seconds
    }
    return () => clearTimeout(timer);
  }, [isControlsVisible, callState]);

  useEffect(() => {
    // Показать элементы управления при установлении вызова
    if (callState === "connected" || callState === "outgoing") {
      setIsControlsVisible(true);
    }
  }, [callState]);

  if (callState === "idle" || callState === "declined") {
    return null;
  }

  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col items-center justify-between p-8">
        <div className="text-center text-white">
          <div className="w-24 h-24 rounded-full mx-auto border-2 border-white bg-gray-600" />
          <h2 className="text-3xl mt-4">{participantName}</h2>
          <p className="text-gray-300">Входящий звонок...</p>
        </div>
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
                <title>Отклонить</title>
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
                <title>Принять</title>
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
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black z-50"
      onMouseMove={() => setIsControlsVisible(true)}
      onClick={() => setIsControlsVisible(true)}
    >
      {" "}
      {/* Основное видео (собеседник или вы) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <VideoPlayer
          stream={isSwapped ? localStream : remoteStream}
          muted={isSwapped}
        />
      </div>
      {/* Маленькое видео (вы или собеседник) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleSwapStreams}
        onKeyDown={(e) => e.key === "Enter" && handleSwapStreams(e)}
        className="absolute bottom-6 right-4 w-28 h-40 cursor-pointer bg-black rounded-lg border-2 border-gray-600 flex items-center justify-center overflow-hidden sm:bottom-32 sm:right-8 sm:w-64 sm:h-40"
      >
        <VideoPlayer
          stream={isSwapped ? remoteStream : localStream}
          muted={!isSwapped}
        />
      </div>
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 sm:p-8 text-center text-white transition-opacity duration-300 ${
          isControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <h2 className="text-2xl sm:text-3xl mt-4">{participantName}</h2>
        <p className="text-gray-300">
          {callState === "connecting" || callState === "outgoing"
            ? "Соединение..."
            : "В звонке"}
        </p>
      </div>
      {/* Кнопки управления */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${
          isControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-3xl mx-auto flex justify-center items-center gap-x-3 sm:gap-x-6">
          {/* видео */}
          <button
            type="button"
            onClick={() => webRTCManager.toggleVideo()}
            className="p-3 sm:p-4 bg-gray-600/70 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6 sm:w-8 sm:h-8"
            >
              <title>Выключить видео</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 1.263c.11.11.167.25.167.402v6.036c0 .152-.057.292-.167.402l-1.263 1.263a1.5 1.5 0 01-1.061.44H4.465a1.5 1.5 0 01-1.06-.44l-1.263-1.263A1.5 1.5 0 012 16.036V9.964c0-.152.057-.292.167-.402l1.263-1.263c.11-.11.25-.167.402-.167h10.928c.152 0 .292.057.402.167z"
              />
            </svg>
          </button>
          {/* Звук */}
          <button
            type="button"
            onClick={() => webRTCManager.toggleAudio()}
            className="p-3 sm:p-4 bg-gray-600/70 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6 sm:w-8 sm:h-8"
            >
              <title>Выключить звук</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          {/* Переключение камеры */}
          <button
            type="button"
            onClick={() => webRTCManager.switchCamera()}
            className="p-3 sm:p-4 bg-gray-600/70 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6 sm:w-8 sm:h-8"
            >
              <title>Переключить камеру</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
          </button>
          {/* Демонстрация экрана */}
          <button
            type="button"
            onClick={() => webRTCManager.toggleScreenShare()}
            className="p-3 sm:p-4 bg-gray-600/70 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6 sm:w-8 sm:h-8"
            >
              <title>Поделиться экраном</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0h-3.375m0 0a2.25 2.25 0 01-2.25 2.25H10.5a2.25 2.25 0 01-2.25-2.25m0 0H3"
              />
            </svg>
          </button>
          {/* Завершение звонка */}
          <button
            type="button"
            onClick={() => webRTCManager.closeConnection()}
            className="p-3 sm:p-4 bg-red-600 rounded-full text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6 sm:w-8 sm:h-8"
            >
              <title>Завершить звонок</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6.75v-1.5a2.25 2.25 0 00-2.25-2.25H10.5a2.25 2.25 0 00-2.25 2.25v1.5m3 13.5-3-3m0 0l-3 3m3-3v-6m-1.5 9H5.625c-.621 0-1.125-.504-1.125-1.125V10.125c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125H16.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
