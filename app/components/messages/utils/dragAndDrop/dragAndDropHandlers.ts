import type { Dispatch, SetStateAction } from "react";

export const handlerDragAndDrop = (
  setIsDragging: Dispatch<SetStateAction<boolean>>,
) => {
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

  return {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleAttachmentClick,
  };
};
