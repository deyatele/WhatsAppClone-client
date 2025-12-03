/**
 * Вспомогательная функция для добавления заголовка авторизации
 */
export const withAuth = (
  token?: string,
  options: RequestInit = {},
): RequestInit => ({
  ...options,
  headers: {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  },
});

