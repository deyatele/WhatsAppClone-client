// app/lib/crypto/retryMechanism.ts
/* Механизм повторной отправки недоставленных сообщений. */

import {
  type EncryptedMessage,
  encryptMessage,
  generateSessionKey,
} from "./messageEncryptor";
import { setMessageStatus } from "./messageStatus";

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

/* Задержка */
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/* Отправка с повторами */
export async function sendWithRetry(
  message: string,
  sendFn: (payload: EncryptedMessage) => Promise<boolean>,
  opts?: RetryOptions,
): Promise<void> {
  const { maxAttempts = 3, delayMs = 1500 } = opts || {};
  let success = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const key = await generateSessionKey();
      const encrypted = await encryptMessage(message, key);
      const delivered = await sendFn(encrypted);

      if (delivered) {
        setMessageStatus(encrypted.cipherTextB64, "decrypted");
        success = true;
        break;
      } else {
        setMessageStatus(encrypted.cipherTextB64, "undelivered");
      }
    } catch {
      setMessageStatus(message, "failed");
    }

    if (!success && attempt < maxAttempts) await sleep(delayMs);
  }

  if (!success) throw new Error("Не удалось доставить сообщение");
}

/* Повторная отправка вручную */
export async function retrySend(
  originalMessage: string,
  sendFn: (payload: EncryptedMessage) => Promise<boolean>,
) {
  try {
    await sendWithRetry(originalMessage, sendFn, { maxAttempts: 1 });
  } catch {
    setMessageStatus(
      originalMessage,
      "failed",
      "Повторная отправка не удалась",
    );
  }
}
