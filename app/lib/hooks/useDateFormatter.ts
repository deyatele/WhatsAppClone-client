import { useCallback } from "react";

export const useDateFormatter = () => {
  const format = useCallback((dateString: string): string => {
    const dateNow = new Date();
    const yesterday = new Date(dateNow);
    yesterday.setDate(dateNow.getDate() - 1);
    try {
      if (!dateString) throw new Error("Нет данных для формирования даты");

      const dateDiff = (createdAt: string): boolean =>
        Date.now() - new Date(createdAt).getTime() > 864e5; // 24 * 60 * 1000;

      return `${yesterday.getDate() === new Date(dateString).getDate() ? "вчера" : new Date(dateString).getDate() === dateNow.getDate() ? "сегодня" : ""} ${new Date(
        dateString,
      ).toLocaleTimeString([], {
        day:
          dateDiff(dateString) &&
          yesterday.getDate() !== new Date(dateString).getDate()
            ? "2-digit"
            : undefined,
        month:
          dateDiff(dateString) &&
          yesterday.getDate() !== new Date(dateString).getDate()
            ? "long"
            : undefined,
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch (error) {
      console.error(
        `ERROR: Ошибка в получении даты. Нет данных или не правильный формат. Переданные данные: ${dateString}. ${error}`,
      );
      return "";
    }
  }, []);

  return { format };
};
