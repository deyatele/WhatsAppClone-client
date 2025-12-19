import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import EmojiPicker, {
  type EmojiClickData,
  SkinTones,
  Theme,
} from "emoji-picker-react";
import { $getSelection, $insertNodes } from "lexical";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { $createEmojiNode } from "../../MessageInput/emojiNode";

export const EmojiPickerPlugin = ({
  setIsEmojiPickerOpen,
  isOpen,
  editorRef,
}: {
  setIsEmojiPickerOpen: (open: boolean) => void;
  isOpen: boolean;
  editorRef: RefObject<HTMLDivElement | null>;
}) => {
  const [editor] = useLexicalComposerContext();
  const emojiRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        editorRef.current?.contains(target) ||
        emojiRef.current?.contains(target)
      ) {
        return;
      }
      setIsEmojiPickerOpen(false);
    },
    [editorRef, setIsEmojiPickerOpen],
  );
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key && isOpen) {
        setIsEmojiPickerOpen(false);
      }
    },
    [isOpen, setIsEmojiPickerOpen],
  );
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClickOutside, handleEscape]);

  const insertEmoji = (emojiData: EmojiClickData) => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        const emojiNode = $createEmojiNode(
          emojiData.emoji,
          emojiData.unified,
          emojiData.names || [],
          emojiData.imageUrl,
        );
        $insertNodes([emojiNode]);
      }
    });
  };

  return (
    <div
      className="absolute bottom-full mb-2 left-4 rounded-lg z-10 overflow-y-auto "
      role="dialog"
      aria-modal="true"
      aria-label="Выбор эмодзи"
      ref={emojiRef}
    >
      <EmojiPicker
        open={isOpen}
        theme={Theme.DARK}
        onEmojiClick={insertEmoji}
        searchPlaceholder="Поиск"
        defaultSkinTone={SkinTones.MEDIUM}
      />
    </div>
  );
};
