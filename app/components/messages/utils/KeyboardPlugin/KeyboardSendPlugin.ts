import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { KEY_DOWN_COMMAND, type LexicalEditor } from "lexical";
import { useEffect } from "react";

export const KeyboardSendPlugin = ({
  onSend,
  isEmpty,
}: {
  onSend: (editor: LexicalEditor) => void;
  isEmpty: boolean;
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (!isEmpty) {
            onSend(editor);
          }
          return true;
        }
        return false;
      },
      1,
    );
  }, [editor, onSend, isEmpty]);

  return null;
};
