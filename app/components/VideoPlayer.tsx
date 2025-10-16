"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

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
            .catch((e) => console.error("VideoPlayer: Autoplay failed:", e));
        };
      } else {
        console.log("VideoPlayer: Stream is null.");
        internalRef.current.srcObject = null;
      }
    } else {
      console.log("VideoPlayer: internalRef.current is null.");
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
