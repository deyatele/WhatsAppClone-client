import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const { callState, localStream, remoteStream } = useChatStore();
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useLayoutEffect(() => {
    const setHeight = () => {
      if (overlayRef.current) {
        overlayRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    window.addEventListener("resize", setHeight);
    setHeight();

    return () => window.removeEventListener("resize", setHeight);
  }, []);

  const handleDecline = () => {
    webRTCManager.closeConnection();
  };

  const handleAccept = () => {
    webRTCManager.answerCall();
  };

  const handleSwapStreams = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setIsSwapped((prev) => !prev);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      (isControlsVisible && callState !== "incoming") ||
      callState !== "calling"
    ) {
      timer = setTimeout(() => {
        setIsControlsVisible(false);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [isControlsVisible, callState]);
  useEffect(() => {
    // Показать элементы управления при установлении вызова
    if (
      callState === "calling" ||
      callState === "incoming" ||
      callState === "outgoing"
    ) {
      setIsControlsVisible(true);
    }
    if (
      audioRef.current &&
      (callState === "calling" || callState === "incoming")
    ) {
      audioRef.current.play().catch((error) => {
        console.error("Ошибка воспроизведения звука:", error);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [callState]);

  if (callState === "idle" || callState === "declined") {
    return null;
  }

  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col items-center justify-between p-8">
        <audio ref={audioRef} src="/ringtones/classic-phone-ring.wav" loop />
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
              <TelephoneXIcon className="w-8 h-8" />
            </div>
            <p>Отклонить</p>
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex flex-col items-center text-white gap-y-2"
          >
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <TelephoneIcon className="w-8 h-8" />
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
      <audio ref={audioRef} src="/ringtones/long-sound-of-one-beep.wav" loop />{" "}
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
        className={`absolute top-0 left-0 right-0 bg-linear-to-b from-black/70 to-transparent p-4 sm:p-8 text-center text-white transition-opacity duration-300 ${
          isControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <h2 className="text-2xl sm:text-3xl mt-4">{participantName}</h2>
        <p className="text-gray-300">
          {callState === "calling" ? "Соединение..." : "В звонке"}
        </p>
      </div>
      {/* Кнопки управления */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${
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
            <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          {/* Звук */}
          <button
            type="button"
            onClick={() => webRTCManager.toggleAudio()}
            className="p-3 sm:p-4 bg-gray-600/70 rounded-full text-white"
          >
            <MicIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          {/* Переключение камеры */}
          <button
            type="button"
            onClick={() => webRTCManager.switchCamera()}
            className="p-3 sm:p-4 bg-gray-600/70 rounded-full text-white"
          >
            <CameraRotateIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          {/* Демонстрация экрана */}
          <button
            type="button"
            onClick={() => webRTCManager.toggleScreenShare()}
            className="p-3 sm:p-4 bg-gray-600/70 rounded-full text-white"
          >
            <ScreenShareIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          {/* Завершение звонка */}
          <button
            type="button"
            onClick={() => webRTCManager.closeConnection()}
            className="p-3 sm:p-4 bg-red-600 rounded-full text-white"
          >
            <TelephoneXIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};
