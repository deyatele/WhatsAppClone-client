"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { log } from "../lib/log";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
}

export const VideoPlayer = forwardRef<
  HTMLVideoElement | null,
  VideoPlayerProps
>(({ stream, muted = false }, ref) => {
  const internalRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle<HTMLVideoElement | null, HTMLVideoElement | null>(
    ref,
    () => internalRef.current,
    [],
  );

  useEffect(() => {
    if (internalRef.current) {
      if (stream) {
        internalRef.current.srcObject = stream;
        internalRef.current.onloadedmetadata = () => {
          internalRef.current
            ?.play()
            .catch((e) =>
              log(`ERROR: VideoPlayer: Ошибка автовоспроизведения: ${e}`),
            );
        };
      } else {
        log("DEBUG: VideoPlayer: Поток отсутствует.");
        internalRef.current.srcObject = null;
      }
    } else {
      log("DEBUG: VideoPlayer: internalRef.current равен null.");
    }
  }, [stream]);

  return (
    <video
      ref={internalRef}
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full object-contain"
    />
  );
});

VideoPlayer.displayName = "VideoPlayer";
