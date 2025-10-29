import { ChatList } from "./components/ChatList";
import { ChatWindow } from "./components/ChatWindow";
import JoinChatModale from "./components/modal/joinChatModal";
import StoreInitializer from "./components/StoreInitializer";
import { getChatsAndToken } from "./lib/getChats";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { chats, token } = await getChatsAndToken();
  const searchParamsResolved = await searchParams;
  const inviteToken = searchParamsResolved.invite;

  return (
    <main className="flex h-screen">
      <StoreInitializer chats={chats} />
      <div className="w-1/3 ">
        <ChatList />
      </div>
      <div className="w-2/3">
        {inviteToken && token ? (
          <JoinChatModale inviteToken={inviteToken} accessToken={token} />
        ) : (
          <ChatWindow />
        )}
      </div>
    </main>
  );
}
