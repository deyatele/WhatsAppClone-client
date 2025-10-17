"use client";

import { ModalProvider, useModal } from "../lib/ModalContext";
import { useChatStore } from "../lib/store";
import { CallOverlay } from "./CallOverlay";
import Modal from "./Modal";

function ModalWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, closeModal, modalContent } = useModal();
  return (
    <>
      {children}
      <Modal isOpen={isOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
    </>
  );
}

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { callState } = useChatStore();

  return (
    <ModalProvider>
      <ModalWrapper>
        {children}
        {callState !== "idle" && <CallOverlay />}
      </ModalWrapper>
    </ModalProvider>
  );
}
