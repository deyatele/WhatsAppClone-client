"use client";

export enum LoaderSize {
  sm = 4,
  md = 5,
  lg = 6,
  xl = 10,
  "2xl" = 16,
  "3xl" = 24,
  "4xl" = 28,
  "5xl" = 56,
}

export function Loader({ size = LoaderSize.xl }: { size?: LoaderSize }) {
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
