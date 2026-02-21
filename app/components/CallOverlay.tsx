import type { FC } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChatStore } from "../lib/store";
import { webRTCManager } from "../lib/WebRTCManager";
import {
  CameraRotateIcon,
  MicIcon,
  ScreenShareIcon,
  TelephoneIcon,
  TelephoneXIcon,
  VideoCameraIcon,
} from "./ui/icons";
import { VideoPlayer } from "./ui/VideoPlayer";

interface CallOverlayProps {
  participantName?: string;
}

export const CallOverlay: FC<CallOverlayProps> = ({
  participantName = "Собеседник",
}) => {
  const {
    callState,
    localStream,
    remoteStream,
    isMicOn,
    isVideoOn,
    isScreenShareOn,
  } = useChatStore();

  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Установка высоты окна (для мобильных)
  useLayoutEffect(() => {
    const setHeight = () => {
      const node = overlayRef.current;
      if (node) {
        node.style.height = `${window.innerHeight}px`;
      }
    };

    setHeight();
    window.addEventListener("resize", setHeight);
    return () => window.removeEventListener("resize", setHeight);
  }, []);

  // Автоматическое скрытие элементов управления
  useEffect(() => {
    if (callState === "calling") {
      const timer = setTimeout(() => {
        setIsControlsVisible(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  // Управление звуком вызова
  useEffect(() => {
    if (callState === "calling" || callState === "incoming") {
      setIsControlsVisible(true);
      audioRef.current
        ?.play()
        .catch((err) => console.warn("Автовоспроизведение отклонено:", err));
    } else {
      const currentAudio = audioRef.current;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0; // Избегаем присваивания в выражении
      }
    }
  }, [callState]);

  const handleDecline = () => webRTCManager.closeConnection();
  const handleAccept = () => webRTCManager.answerCall();

  const handleSwapStreams = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if ("key" in e && e.key !== "Enter") return;
    setIsSwapped((prev) => !prev);
  };

  const handleActivity = () => setIsControlsVisible(true);

  if (callState === "idle" || callState === "declined") return null;

  // Входящий вызов
  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col items-center justify-between p-8 text-white">
        <audio ref={audioRef} src="/ringtones/classic-phone-ring.wav" loop />
        <div className="text-center">
          <div className="w-24 h-24 rounded-full mx-auto border-2 border-white bg-gray-600" />
          <h2 className="text-3xl mt-4">{participantName}</h2>
          <p className="text-gray-300">Входящий звонок...</p>
        </div>
        <div className="flex justify-center items-center gap-x-8">
          <button
            type="button"
            onClick={handleDecline}
            className="flex flex-col items-center gap-y-2 focus:outline-none"
            aria-label="Отклонить вызов"
          >
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150">
              <TelephoneXIcon className="w-8 h-8" />
            </div>
            <span>Отклонить</span>
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex flex-col items-center gap-y-2 focus:outline-none"
            aria-label="Принять вызов"
          >
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150">
              <TelephoneIcon className="w-8 h-8" />
            </div>
            <span>Принять</span>
          </button>
        </div>
      </div>
    );
  }

  // Активный вызов
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black z-50"
      onMouseMove={handleActivity}
      onClick={handleActivity}
      tabIndex={0}
      aria-label="Экран вызова"
    >
      <audio ref={audioRef} src="/ringtones/long-sound-of-one-beep.wav" loop />

      <div className="absolute inset-0 flex items-center justify-center">
        <VideoPlayer
          stream={isSwapped ? localStream : remoteStream}
          muted={isSwapped}
          aria-label={isSwapped ? "Ваше видео" : "Видео собеседника"}
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleSwapStreams}
        onKeyDown={handleSwapStreams}
        className="absolute bottom-6 right-4 w-28 h-40 cursor-pointer bg-black rounded-lg border-2 border-gray-600 overflow-hidden sm:bottom-32 sm:right-8 sm:w-64 sm:h-40 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Переключить основное видео"
      >
        <VideoPlayer
          stream={isSwapped ? remoteStream : localStream}
          muted={!isSwapped}
          aria-label={isSwapped ? "Видео собеседника" : "Ваше видео"}
        />
      </div>

      <div
        className={`absolute top-0 left-0 right-0 bg-linear-to-b from-black/70 to-transparent p-4 sm:p-8 text-center text-white transition-opacity duration-300 ${isControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <h2 className="text-2xl sm:text-3xl mt-4">{participantName}</h2>
        <p className="text-gray-300">
          {callState === "calling" ? "Соединение..." : "В звонке"}
        </p>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${isControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="w-full max-w-3xl mx-auto flex justify-center items-center gap-x-3 sm:gap-x-6">
          <button
            type="button"
            onClick={() => webRTCManager.toggleVideo()}
            className={`p-3 sm:p-4 bg-gray-600/70 rounded-full text-white transform transition-all duration-150 active:scale-95 ${isVideoOn ? "border-2 border-emerald-600" : ""}`}
            aria-pressed={isVideoOn}
            aria-label={isVideoOn ? "Выключить видео" : "Включить видео"}
          >
            <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          <button
            type="button"
            onClick={() => webRTCManager.toggleAudio()}
            className={`p-3 sm:p-4 bg-gray-600/70 rounded-full text-white transform transition-all duration-150 active:scale-95 ${isMicOn ? "border-2 border-emerald-600" : ""}`}
            aria-pressed={isMicOn}
            aria-label={isMicOn ? "Выключить микрофон" : "Включить микрофон"}
          >
            <MicIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          <button
            type="button"
            onClick={() => webRTCManager.switchCamera()}
            className="p-3 sm:p-4 bg-gray-600/70 rounded-full text-white transform transition-all duration-150 active:scale-95"
            aria-label="Переключить камеру"
          >
            <CameraRotateIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          <button
            type="button"
            onClick={() => webRTCManager.toggleScreenShare()}
            className={`p-3 sm:p-4 bg-gray-600/70 rounded-full text-white transform transition-all duration-150 active:scale-95 ${isScreenShareOn ? "border-2 border-emerald-600" : ""}`}
            aria-pressed={isScreenShareOn}
            aria-label={
              isScreenShareOn
                ? "Остановить демонстрацию экрана"
                : "Начать демонстрацию экрана"
            }
          >
            <ScreenShareIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="p-3 sm:p-4 bg-red-600 rounded-full text-white transform transition-all duration-150 active:scale-95"
            aria-label="Завершить вызов"
          >
            <TelephoneXIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};
