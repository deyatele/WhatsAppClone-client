"use client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { chatApi } from "../../lib/api";
import { useChat } from "../../lib/hooks/useChat";
import { Loader } from "../ui/Loader";

interface JoinChatModalProps {
  inviteToken: string;
  closeModale: () => void;
}

export default function JoinChatModal({
  inviteToken,
  closeModale,
}: JoinChatModalProps) {
  const [userInviteId, setUserInviteId] = useState<string | null | undefined>(
    undefined,
  );
  const { getUserInviteChat, handleActionCreateChat } = useChat();
  const [load, setLoad] = useState(false);
  const { createChat } = chatApi;
  useEffect(() => {
    if (!inviteToken || load || userInviteId !== undefined) return;
    setLoad(true);
    getUserInviteChat(inviteToken)
      .then((id) => {
        id ? setUserInviteId(id) : setUserInviteId(null);
      })
      .catch((error) => {
        console.error(
          "Ошибка при получении пользователя по приглашению:",
          error,
        );
        closeModale();
        redirect("/");
      })
      .finally(() => setLoad(false));
  }, [inviteToken, getUserInviteChat, closeModale, load, userInviteId]);

  if (!inviteToken) return null;

  if (load) {
    return (
      <div className="relative w-full max-w-md px-4 py-8 space-y-6 bg-gray-800 rounded-lg shadow-md text-white">
        <Loader />
      </div>
    );
  }
  const handleJoinChat = async () => {
    try {
      if (!userInviteId)
        throw new Error("Нет пользователя к которому присоединяемся");
      const res = await createChat(userInviteId, inviteToken);
      if (!res?.id) throw new Error("Не получилось присоединится к чату");
      handleActionCreateChat(userInviteId, res.id);
      closeModale();
      redirect(`/`);
    } catch (error) {
      console.error(error);
      closeModale();
      redirect("/");
    }
  };

  const handleDeclineChat = async () => {
    closeModale();
    redirect("/");
  };
  if (userInviteId === undefined) return null;
  return (
    <div className="relative w-full max-w-md px-4 py-8 space-y-6 bg-gray-800 rounded-lg shadow-md text-white cursor-pointer">
      <span
        className="absolute top-2 right-3 text-xl"
        onClick={handleDeclineChat}
      >
        X
      </span>
      {userInviteId !== null ? (
        <>
          <h1 className="text-2xl font-bold text-center">
            Присоединиться к чату?
          </h1>
          <p className="text-center">
            Вас пригласили в чат. Хотите присоединиться?
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={handleJoinChat}
            >
              Да
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={handleDeclineChat}
            >
              Нет
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-center">
            Ошибка приглашения?
          </h1>
          <p className="text-center">
            Приглашение недействительно или произошла ошибка.
          </p>
          <p className="text-center text-sm text-gray-400">
            Попробуйте связаться с отправителем приглашения или вернуться на
            главную страницу.
          </p>
        </>
      )}
    </div>
    // </div>
  );
}
