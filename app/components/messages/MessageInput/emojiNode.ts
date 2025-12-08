import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  type TextModeType,
  TextNode,
} from "lexical";

export type SerializedEmojiNode = Spread<
  {
    emoji: string;
    unified?: string;
    names?: string[];
    imageUrl?: string;
    type: "emoji";
    version: 1;
  },
  SerializedTextNode
>;

type SerializedTextNode = Spread<
  {
    text: string;
    type: "text";
    format: number;
    detail: number;
    mode: TextModeType;
    style: string;
  },
  SerializedLexicalNode
>;

export class EmojiNode extends TextNode {
  __emoji: string;
  __unified?: string;
  __names?: string[];
  __imageUrl?: string;

  static getType(): string {
    return "emoji";
  }

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(
      node.__emoji,
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
    this.__emoji = emoji;
    this.__unified = unified;
    this.__names = names;
    this.__imageUrl = imageUrl;
  }

  // Запрещаем вставку текста до и после этого узла
  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  // Делаем узел изолированным
  isIsolated(): boolean {
    return true;
  }

  // Делаем узел инлайновым
  isInline(): true {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    element.className = "emojiImage";
    element.setAttribute("aria-label", this.__emoji);
    element.textContent = this.__emoji;
    if (this.__imageUrl) {
      const emoji = document.createElement("img");
      emoji.className = "emoji-node";
      emoji.src = this.__imageUrl;
      emoji.alt = this.__emoji;
      emoji.width = 20;
      emoji.height = 20;
      emoji.style.verticalAlign = "middle";
      emoji.style.userSelect = "text";
      emoji.onload = () => {
        emoji.style.display = "inline-block";
        element.style.color = "transparent";
      };
      emoji.onerror = () => {
        emoji.style.display = "none";
        element.style.color = "inherit";
        emoji.remove();
      };
      element.appendChild(emoji);
    }

    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (
      prevNode.__emoji !== this.__emoji ||
      prevNode.__imageUrl !== this.__imageUrl
    ) {
      dom.setAttribute("aria-label", this.__emoji);
      if (this.__imageUrl) {
        dom.style.backgroundImage = `url("${this.__imageUrl}")`;
      } else {
        dom.style.backgroundImage = "";
      }
      // Обновляем textContent, если emoji изменился
      dom.textContent = this.__emoji;
      return true;
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (
          domNode.classList.contains("emojiImage") ||
          domNode.style.backgroundImage.includes("emoji")
        ) {
          return {
            conversion: $convertEmojiSpan,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.className = "emojiImage";
    // УБИРАЕМ: element.setAttribute("data-lexical-text", "true");
    element.setAttribute("aria-label", this.__emoji);

    if (this.__imageUrl) {
      element.style.backgroundImage = `url("${this.__imageUrl}")`;
    }
    element.textContent = this.__emoji;

    return { element };
  }

  static importJSON(serialized: SerializedEmojiNode): EmojiNode {
    return $createEmojiNode(
      serialized.emoji,
      serialized.unified,
      serialized.names,
      serialized.imageUrl,
    );
  }

  exportJSON(): SerializedEmojiNode {
    const baseSerialized = super.exportJSON();
    return {
      ...baseSerialized,
      type: "emoji",
      version: 1,
      emoji: this.__emoji,
      unified: this.__unified,
      names: this.__names,
      imageUrl: this.__imageUrl,
    };
  }
}

function $convertEmojiSpan(domNode: HTMLElement): DOMConversionOutput {
  const emojiFromText = domNode.textContent || "";
  const emoji = domNode.getAttribute("aria-label") || emojiFromText;
  const style = domNode.style.backgroundImage;
  const imageUrl = style
    ? style.replace(/^url\(["']?/, "").replace(/["']?\)$/, "")
    : undefined;

  const node = $createEmojiNode(emoji, undefined, undefined, imageUrl);
  return { node };
}

export function $createEmojiNode(
  emoji: string,
  unified?: string,
  names?: string[],
  imageUrl?: string,
  key?: NodeKey,
): EmojiNode {
  const node = new EmojiNode(emoji, unified, names, imageUrl, key);
  return $applyNodeReplacement(node);
}

export function $isEmojiNode(
  node: LexicalNode | null | undefined,
): node is EmojiNode {
  return node instanceof EmojiNode;
}
