import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import { SendMessageIcon } from "./icons";

export const SendButton = ({
  onClick,
  isEmpty,
}: {
  onClick: (editor: LexicalEditor) => void;
  isEmpty: boolean;
}) => {
  const [editor] = useLexicalComposerContext();

  return (
    <button
      type="button"
      disabled={isEmpty}
      className={`ml-2 p-2 rounded-full transition-colors ${
        isEmpty
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700"
      }`}
      onClick={() => onClick(editor)}
    >
      <SendMessageIcon width={24} height={24} />
    </button>
  );
};
