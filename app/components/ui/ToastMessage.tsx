"use client";

import { useEffect, useState } from "react";

type ToastMessageProps = {
  message: string;
  duration?: number;
};

export function ToastMessage({ message, duration = 3000 }: ToastMessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-400 p-4 rounded-md shadow-lg text-white z-50">
      {message}
    </div>
  );
}
