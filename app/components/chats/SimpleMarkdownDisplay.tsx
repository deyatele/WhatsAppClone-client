import { createElement } from "react";

interface SimpleMarkdownDisplayProps {
  content: string;
  className?: string;
}

export const SimpleMarkdownDisplay = ({
  content,
  className,
}: SimpleMarkdownDisplayProps) => {
  if (!content) return null;
console.log(content)
  // Заменяем HTML-сущности обратно в символы
  let processedContent = content
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#32;/g, " ") // обработка пробелов
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Обработка инлайн-форматирования
  // Жирный текст
  processedContent = processedContent.replace(
    /\*\*(.*?)\*\*/g,
    (_, content) => `<strong>${content}</strong>`,
  );
  // Курсив
  processedContent = processedContent.replace(
    /\*(.*?)\*/g,
    (_, content) => `<em>${content}</em>`,
  );
  // Зачеркнутый
  processedContent = processedContent.replace(
    /~~(.*?)~~/g,
    (_, content) => `<s>${content}</s>`,
  );
  // Код
  processedContent = processedContent.replace(
  /(`[^`]*`)(\s*(`[^`]*`))*/g,
  (match) => {
    const content = match
      .replace(/`/g, '')
      .replace(/\n/g, ' ')         
    return `<pre>${content}</pre>`;
  }
);

  // Создаем безопасный способ вставки HTML
  const createMarkup = () => ({ __html: processedContent });
console.log('post',processedContent)
  return createElement("span", {
    className,
    dangerouslySetInnerHTML: createMarkup(),
  });
};
