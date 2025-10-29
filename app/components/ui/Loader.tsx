"use client";

/**
 * Простой компонент-загрузчик в виде спиннера.
 */
export function Loader() {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <div
        className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"
        role="status"
        aria-live="polite"
      />
      <span className="sr-only">Загрузка...</span>
    </div>
  );
}
