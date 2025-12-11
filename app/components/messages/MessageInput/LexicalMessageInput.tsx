"use client";

import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import type { EmojiClickData } from "emoji-picker-react";
import EmojiPicker, { SkinTones, Theme } from "emoji-picker-react";
import {
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AttachmentIcon,
  EmojiPickerIcon,
  SendMessageIcon,
} from "../../ui/icons";
import { FormattingToolbarPlugin } from "../utils/FormattingToolbarPlugin";
import { $createEmojiNode, $isEmojiNode, EmojiNode } from "./emojiNode";

interface LexicalMessageInputProps {
  onMessageChange?: (text: string) => void;
  handleSendMessage: (text: string) => void;
}

const EditorPlugin = ({
  onMessageChange,
}: {
  onMessageChange?: (text: string) => void;
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onMessageChange?.(markdown);
      });
    });
  }, [editor, onMessageChange]);

  return null;
};

const EmojiPickerPlugin = ({
  setIsEmojiPickerOpen,
  isOpen,
}: {
  setIsEmojiPickerOpen: (open: boolean) => void;
  isOpen: boolean;
}) => {
  const [editor] = useLexicalComposerContext();

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
    setIsEmojiPickerOpen(false);
  };

  return (
    <div
      className="absolute bottom-full mb-2 left-4 rounded-lg z-10 overflow-y-auto "
      role="dialog"
      aria-modal="true"
      aria-label="Выбор эмодзи"
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

const KeyboardSendPlugin = ({
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

const SendButton = ({
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

const EmojiDeletionPlugin = () => {
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

export const LexicalMessageInput = ({
  onMessageChange,
  handleSendMessage,
}: LexicalMessageInputProps) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isEmpty, setIsEmpty] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleSendClick = useCallback(
    (editor: LexicalEditor) => {
      const markdown = editor.getEditorState().read(() => {
        return $convertToMarkdownString(TRANSFORMERS);
      });

      if (markdown.trim()) {
        console.log(markdown);
        handleSendMessage(markdown);
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.format = 0;
          }
        });
      }
    },
    [handleSendMessage],
  );

  const initialConfig = {
    namespace: "MessageInput",
    theme: {
      paragraph: "mb-0 select-text",
      text: {
        bold: "font-bold",
        italic: "italic",
        strikethrough: "line-through",
        code: "bg-gray-800 px-1 rounded font-mono leading-[1.1]",
      },
    },
    nodes: [EmojiNode],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  };

  // Компонент для отслеживания состояния редактора
  const StateHandlerPlugin = () => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
      const unregisterListener = editor.registerUpdateListener(
        ({ editorState }) => {
          editorState.read(() => {
            const root = $getRoot();
            const content = root.getTextContent();
            setIsEmpty(!content.trim());
          });
        },
      );

      // Проверяем начальное состояние
      const initialContent = editor.getEditorState().read(() => {
        const root = $getRoot();
        return root.getTextContent();
      });
      setIsEmpty(!initialContent.trim());

      return unregisterListener;
    }, [editor]);

    return null;
  };

  // Отслеживание выделения текста для отображения панели форматирования
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!editorRef.current) return;
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setShowFormattingToolbar(false);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        setShowFormattingToolbar(false);
        return;
      }
      const rect = range.getBoundingClientRect();
      const containerRect = editorRef.current.getBoundingClientRect();

      if (rect.width === 0) {
        setShowFormattingToolbar(false);
        return;
      }

      const top = rect.top - containerRect.top - 100;
      let left = rect.left - containerRect.left + 50 + rect.width / 2;
      if (left < 80) left = 80;
      if (left > containerRect.left) left = left - 20;
      setToolbarPosition({ top, left });
      setShowFormattingToolbar(true);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Скрытие панели при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        editorRef.current?.contains(target) ||
        toolbarRef.current?.contains(target)
      ) {
        return;
      }
      setShowFormattingToolbar(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log(`Файлы (${files.length}) были перетащены.`);
      // Обработка вложений — отдельно
    }
  };

  const handleAttachmentClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.click();
  };

  return (
    <div
      className={`relative p-4 bg-gray-800 ${isDragging ? "bg-gray-700" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="relative bg-gray-700 rounded-lg p-2">
        <div className="flex items-center">
          <div className="flex self-stretch">
            <div className="flex items-end">
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-600 transition-colors mr-2"
                onClick={handleAttachmentClick}
              >
                <AttachmentIcon width={24} height={24} />
              </button>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-600 transition-colors mr-2"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              >
                <EmojiPickerIcon width={24} height={24} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center">
            <LexicalComposer initialConfig={initialConfig}>
              <HistoryPlugin />
              <OnChangePlugin onChange={() => {}} />
              <EmojiDeletionPlugin />
              <StateHandlerPlugin />
              <KeyboardSendPlugin onSend={handleSendClick} isEmpty={isEmpty} />
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="w-full p-2 g-transparent text-white text-xl resize-none outline-none max-h-[200px] overflow-y-auto min-h-6"
                    data-placeholder="Введите сообщение..."
                    ref={editorRef}
                  />
                }
                placeholder={null}
                ErrorBoundary={() => null}
              />
              <EditorPlugin onMessageChange={onMessageChange} />
              {isEmojiPickerOpen && (
                <EmojiPickerPlugin
                  setIsEmojiPickerOpen={setIsEmojiPickerOpen}
                  isOpen={isEmojiPickerOpen}
                />
              )}
              {showFormattingToolbar && (
                <FormattingToolbarPlugin
                  position={toolbarPosition}
                  toolbarRef={toolbarRef}
                />
              )}
              <div className="flex self-stretch items-end">
                <SendButton onClick={handleSendClick} isEmpty={isEmpty} />
              </div>
            </LexicalComposer>
          </div>
        </div>
      </div>
    </div>
  );
};
