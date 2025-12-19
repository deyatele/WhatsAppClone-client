import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  KEY_BACKSPACE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $isEmojiNode } from "../../MessageInput/emojiNode";

export const EmojiDeletionPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchor = selection.anchor;
        if (anchor.offset !== 0) {
          return false;
        }

        const node = anchor.getNode();
        const prevSibling = node.getPreviousSibling();

        if ($isEmojiNode(prevSibling)) {
          event.preventDefault();
          prevSibling.remove();
          return true;
        }

        return false;
      },
      1, // Use a high priority
    );
  }, [editor]);

  return null;
};
