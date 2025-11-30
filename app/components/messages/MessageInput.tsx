"use client";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

export const MessageInput = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
}: MessageInputProps) => {
  return (
    <form onSubmit={handleSendMessage} className="p-4 bg-gray-800">
      <input
        type="text"
        placeholder="Введите сообщение..."
        className="w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
    </form>
  );
};
