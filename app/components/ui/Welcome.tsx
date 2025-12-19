"use client";

import Image from "next/image";

export const Welcome = () => (
  <div className="h-full flex flex-col items-center justify-center text-center bg-gray-900">
    <div className="w-2/3 flex flex-col items-center">
      <Image src={"/logo.png"} width='200' height='200' alt="Расскажи и ..." />
      <h1 className="text-3xl font-light text-gray-300 mt-15">Расскажи и ... веб</h1>
      <p className="mt-4 text-gray-400">Выберите чат, чтобы начать общение.</p>
    </div>
  </div>
);
