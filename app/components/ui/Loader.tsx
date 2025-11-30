"use client";

export function Loader({ size = 12 }: { size?: number }) {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <div
        className={`w-${size} h-${size} animate-spin rounded-full  border-b-2 border-green-500`}
        role="status"
        aria-live="polite"
      />
      <span className="sr-only">Загрузка...</span>
    </div>
  );
}
