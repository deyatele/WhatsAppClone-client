import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { type RefObject, useEffect, useState } from "react";
import {
  FormattingBoldIcon,
  FormattingCodeIcon,
  FormattingItalicIcon,
  FormattingStrikethroughIcon,
} from "../../ui/icons";

export const FormattingToolbarPlugin = ({
  position,
  toolbarRef,
}: {
  position: { top: number; left: number };
  toolbarRef: RefObject<HTMLDivElement | null>;
}) => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          // Проверяем, есть ли выделение (разные позиции anchor и focus)
          const hasSelection = !selection.anchor.is(selection.focus);

          if (hasSelection) {
            // Если есть выделение, проверяем, содержит ли оно данный формат
            // Это позволяет подсвечивать кнопку, даже если отформатирована только часть выделения
            const nodes = selection.getNodes();
            setIsBold(
              nodes.some((node) => $isTextNode(node) && node.hasFormat("bold")),
            );
            setIsItalic(
              nodes.some(
                (node) => $isTextNode(node) && node.hasFormat("italic"),
              ),
            );
            setIsStrikethrough(
              nodes.some(
                (node) => $isTextNode(node) && node.hasFormat("strikethrough"),
              ),
            );
            setIsCode(
              nodes.some((node) => $isTextNode(node) && node.hasFormat("code")),
            );
          } else {
            // Если нет выделения (курсор стоит в тексте), получаем форматирование у текущего узла
            const anchorNode = selection.anchor.getNode();

            if ($isTextNode(anchorNode)) {
              setIsBold(anchorNode.hasFormat("bold"));
              setIsItalic(anchorNode.hasFormat("italic"));
              setIsStrikethrough(anchorNode.hasFormat("strikethrough"));
              setIsCode(anchorNode.hasFormat("code"));
            } else {
              // Если не текстовый узел, сбрасываем состояния
              setIsBold(false);
              setIsItalic(false);
              setIsStrikethrough(false);
              setIsCode(false);
            }
          }
        } else if (selection) {
          // Если нет RangeSelection, но есть selection, сбрасываем состояния
          setIsBold(false);
          setIsItalic(false);
          setIsStrikethrough(false);
          setIsCode(false);
        } else {
          // Если совсем нет selection
          setIsBold(false);
          setIsItalic(false);
          setIsStrikethrough(false);
          setIsCode(false);
        }
      });
    });
  }, [editor]);

  const formatText = (
    formatType: "bold" | "italic" | "strikethrough" | "code",
  ) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute bg-gray-900 rounded-lg p-4 shadow-lg z-20 opacity-80 flex space-x-1 transform -translate-x-1/2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={`p-1 rounded transition-colors opacity-100 ${
          isBold ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-white"
        }`}
        onClick={() => formatText("bold")}
      >
        <FormattingBoldIcon width={26} />
      </button>
      <button
        type="button"
        className={`p-1 rounded transition-colors opacity-100 ${
          isItalic ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-white"
        }`}
        onClick={() => formatText("italic")}
      >
        <FormattingItalicIcon width={26} />
      </button>
      <button
        type="button"
        className={`p-1 rounded transition-colors opacity-100 ${
          isStrikethrough
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-700 text-white"
        }`}
        onClick={() => formatText("strikethrough")}
      >
        <FormattingStrikethroughIcon width={26} />
      </button>
      <button
        type="button"
        className={`p-1 rounded transition-colors opacity-100 ${
          isCode ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-white"
        }`}
        onClick={() => formatText("code")}
      >
        <FormattingCodeIcon width={26} />
      </button>
    </div>
  );
};
