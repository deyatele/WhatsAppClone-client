/**
 * @file emojiNode.ts
 * Узел для хранения и отображения эмодзи в Lexical редакторе
 */

import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from "lexical";

export type SerializedEmojiNode = Spread<
  {
    emoji: string;
    unified: string;
    names: string[];
    imageUrl?: string;
    type: "emoji";
    version: 1;
  },
  SerializedTextNode
>;

export class EmojiNode extends TextNode {
  __unified?: string;
  __names?: string[];
  __imageUrl?: string;

  static getType(): string {
    return "emoji";
  }

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(
      node.__text,
      node.__unified,
      node.__names,
      node.__imageUrl,
      node.__key,
    );
  }

  constructor(
    emoji: string,
    unified?: string,
    names?: string[],
    imageUrl?: string,
    key?: NodeKey,
  ) {
    super(emoji, key);
    this.__unified = unified;
    this.__names = names;
    this.__imageUrl = imageUrl;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    element.className = "emoji-node inline-block";
    element.textContent = this.__text;
    // Применяем стили для лучшего отображения эмодзи
    element.style.fontSize = "1.2em";
    element.style.lineHeight = "1";
    element.style.display = "inline-block";
    element.style.margin = "0 2px";
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", this.__text);
    return element;
  }

  updateDOM(prevNode: EmojiNode, dom: HTMLElement): boolean {
    if (prevNode.__text !== this.__text) {
      dom.textContent = this.__text;
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.classList.contains("emoji-node")) {
          return null;
        }
        return {
          conversion: $convertSpanElement,
          priority: 1,
        };
      },
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("span");
    element.className = "emoji-node inline-block";
    element.textContent = this.__text;
    element.style.fontSize = "1.2em";
    element.style.lineHeight = "1";
    element.style.display = "inline-block";
    element.style.margin = "0 2px";
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", this.__text);
    return { element };
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    const node = $createEmojiNode(
      serializedNode.emoji,
      serializedNode.unified,
      serializedNode.names,
      serializedNode.imageUrl,
    );
    return node;
  }

  exportJSON(): SerializedEmojiNode {
    return {
      ...super.exportJSON(),
      emoji: this.__text,
      unified: this.__unified || "",
      names: this.__names || [],
      imageUrl: this.__imageUrl,
      type: "emoji",
      version: 1,
    };
  }

  isSimpleText(): boolean {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

function $convertSpanElement(domNode: HTMLElement): DOMConversionOutput {
  const emoji = domNode.textContent || "";
  if (domNode.classList.contains("emoji-node")) {
    const node = $createEmojiNode(emoji);
    return { node };
  }
  return { node: null };
}

export function $createEmojiNode(
  emoji: string,
  unified?: string,
  names?: string[],
  imageUrl?: string,
): EmojiNode {
  return $applyNodeReplacement(new EmojiNode(emoji, unified, names, imageUrl));
}

export function $isEmojiNode(
  node: LexicalNode | null | undefined,
): node is EmojiNode {
  return node instanceof EmojiNode;
}
