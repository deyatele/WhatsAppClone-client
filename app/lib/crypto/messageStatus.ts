// app/lib/crypto/messageStatus.ts
/* Управление статусами сообщений. */

export type MessageStatus =
  | "pending"
  | "decrypted"
  | "failed"
  | "undelivered"
  | "superseded";

export interface MessageLog {
  id: string;
  status: MessageStatus;
  error?: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<MessageStatus, string> = {
  pending: "gray",
  decrypted: "green",
  failed: "red",
  undelivered: "orange",
  superseded: "blue",
};

const LOG_KEY = "message-status-log";

/* Получить лог из localStorage */
function getLog(): MessageLog[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as MessageLog[]) : [];
  } catch {
    return [];
  }
}

/* Сохранить лог */
function saveLog(logs: MessageLog[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {
    // пропускаем, если нет доступа
  }
}

/* Обновить статус сообщения */
export function setMessageStatus(
  id: string,
  status: MessageStatus,
  error?: string,
) {
  const logs = getLog();
  const existing = logs.find((l) => l.id === id);
  const entry: MessageLog = {
    id,
    status,
    error,
    updatedAt: new Date().toISOString(),
  };
  if (existing) Object.assign(existing, entry);
  else logs.push(entry);
  saveLog(logs);
}

/* Получить статус сообщения */
export function getMessageStatus(id: string): MessageStatus | null {
  const logs = getLog();
  const found = logs.find((l) => l.id === id);
  return found ? found.status : null;
}

/* Очистить лог (по необходимости) */
export function clearStatuses() {
  localStorage.removeItem(LOG_KEY);
}

/* Утилита: получить цвет для UI */
export function getStatusColor(status: MessageStatus): string {
  return STATUS_COLORS[status];
}
