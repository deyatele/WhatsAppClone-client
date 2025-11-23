"use client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { chatApi } from "../../lib/api";
import { useChat } from "../../lib/hooks/useChat";

interface JoinChatModaleProps {
  inviteToken: string;
}

export default function JoinChatModale({ inviteToken }: JoinChatModaleProps) {
  const [userInviteId, setUserInviteId] = useState<string | null>(null);
  const { getUserInviteChat } = useChat();
  const { createChat } = chatApi;
  useEffect(() => {
    if (!inviteToken) return;
    getUserInviteChat(inviteToken).then((id) => id && setUserInviteId(id));
  }, [inviteToken, getUserInviteChat]);

  const handleJoinChat = async () => {
    try {
      if (!userInviteId)
        throw new Error("Нет пользователя к которому присоединяемся");
      const { chatId } = await createChat(userInviteId);
      if (!chatId) throw new Error("Не получилось присоединится к чату");
      redirect(`/`);
    } catch (error) {
      console.error("Не удалось присоединиться к чату:", error);
      redirect("/");
    }
  };

  const handleDeclineChat = () => {
    redirect("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md text-white">
        <h1 className="text-2xl font-bold text-center">
          Присоединиться к чату?
        </h1>
        <p className="text-center">
          Вас пригласили в чат. Хотите присоединиться?
        </p>
        <div className="flex justify-center space-x-4">
          <form action={handleJoinChat}>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Да
            </button>
          </form>
          <form action={handleDeclineChat}>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Нет
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
