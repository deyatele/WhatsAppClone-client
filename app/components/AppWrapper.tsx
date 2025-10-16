"use client";

import { useChatStore } from "../lib/store";
import { CallOverlay } from "./CallOverlay";

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { callState } = useChatStore();

  return (
    <>
      {children}
      {callState !== "idle" && <CallOverlay />}
    </>
  );
}
