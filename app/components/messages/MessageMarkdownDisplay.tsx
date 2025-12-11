"use client";

import { CodeNode } from "@lexical/code";
import { ListItemNode, ListNode } from "@lexical/list";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $getRoot, LineBreakNode, ParagraphNode, TextNode } from "lexical";
import { useEffect } from "react";
import { EmojiNode } from "./MessageInput/emojiNode";

interface MessageMarkdownDisplayProps {
  content: string;
}

const EditorPlugin = ({ content }: { content: string }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      $convertFromMarkdownString(content, TRANSFORMERS);
    });
  }, [content, editor]);

  return null;
};

export const MessageMarkdownDisplay = ({
  content,
}: MessageMarkdownDisplayProps) => {
  const initialConfig = {
    namespace: "MessageDisplay",
    theme: {
      text: {
        bold: "font-bold",
        italic: "italic",
        strikethrough: "line-through",
        code: "bg-gray-800 px-1 rounded font-mono",
      },
    },
    nodes: [
      ListNode,
      ListItemNode,
      CodeNode,
      ParagraphNode,
      TextNode,
      LineBreakNode,
      HeadingNode,
      QuoteNode,
      EmojiNode,
    ],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorPlugin content={content} />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="w-full bg-transparent resize-none outline-none min-h-6 pointer-events-none"
            contentEditable={false} 
            suppressContentEditableWarning
          />
        }
        placeholder={null}
        ErrorBoundary={() => null}
      />
      <HistoryPlugin />
    </LexicalComposer>
  );
};
