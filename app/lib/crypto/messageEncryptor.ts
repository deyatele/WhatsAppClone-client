/* Шифрование и расшифровка сообщений AES-GCM.
 */

import type { MessageSend } from "../../types";

const AES_ALGO = { name: "AES-GCM", length: 256 };

export type EncryptedMessage = {
  cipherTextB64: string;
  ivB64: string;
  keyB64?: string; // если сообщение отправляется с симметричным ключом
};

/* utils */
function utf8Encode(s: string) {
  return new TextEncoder().encode(s);
}
function utf8Decode(b: ArrayBuffer) {
  return new TextDecoder().decode(b);
}
function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}
function base64ToArrayBuffer(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/* Генерация симметричного ключа для сессии */
export async function generateSessionKey(): Promise<CryptoKey> {
  try {
    return await crypto.subtle.generateKey(AES_ALGO, true, [
      "encrypt",
      "decrypt",
    ]);
  } catch {
    throw new Error("Не удалось сгенерировать ключ");
  }
}

/* Экспорт/импорт симметричного ключа */
export async function exportSessionKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(raw);
}
export async function importSessionKey(b64: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(b64);
  return await crypto.subtle.importKey("raw", raw, AES_ALGO, true, [
    "encrypt",
    "decrypt",
  ]);
}

/* Шифрование текста */
export async function encryptMessage(
  message: string,
  key: CryptoKey,
): Promise<EncryptedMessage> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = utf8Encode(message);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded,
    );
    return {
      cipherTextB64: arrayBufferToBase64(encrypted),
      ivB64: arrayBufferToBase64(iv.buffer),
    };
  } catch {
    throw new Error("Ошибка шифрования");
  }
}

export async function encryptMessageForTwo(
  message: string,
  senderPubJwk: JsonWebKey,
  recipientPubJwk: JsonWebKey,
): Promise<MessageSend> {
  // 1. Генерируем AES-ключ
  const sessionKey = await generateSessionKey();

  // 2. Шифруем сообщение AES-ключом
  const { cipherTextB64, ivB64 } = await encryptMessage(message, sessionKey);

  // 3. Экспортируем raw AES-ключ
  const rawB64 = await exportSessionKey(sessionKey);

  // 4. Импорт RSA-ключей
  const senderPubKey = await crypto.subtle.importKey(
    "jwk",
    senderPubJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  const recipientPubKey = await crypto.subtle.importKey(
    "jwk",
    recipientPubJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  // 5. Шифруем AES-ключ публичным ключем
  async function encryptFor(pubKey: CryptoKey) {
    const raw = base64ToArrayBuffer(rawB64);
    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      pubKey,
      raw,
    );
    return arrayBufferToBase64(encrypted);
  }
  const encryptedKeyForSender = await encryptFor(senderPubKey);

  const encryptedKeyForReceiver = await encryptFor(recipientPubKey);

  // 6. Возвращаем итог
  return {
    encryptedMessage: { cipherTextB64, ivB64 },
    encryptedKeyForSender,
    encryptedKeyForReceiver,
  };
}

export type PropsDecryptMessage = {
  encryptedMessage: { cipherTextB64: string; ivB64: string };
  encryptedKeyB64: string;
  privateKey: CryptoKey;
};

/* Расшифровка текста */
export async function decryptMessageForOne({
  encryptedMessage: { cipherTextB64, ivB64 },
  encryptedKeyB64,
  privateKey,
}: PropsDecryptMessage): Promise<string> {
  const encryptedKeyBuf = base64ToArrayBuffer(encryptedKeyB64);
  const rawAesKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedKeyBuf,
  );

  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const cipherBuf = base64ToArrayBuffer(cipherTextB64);
  const iv = base64ToArrayBuffer(ivB64);

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    aesKey,
    cipherBuf,
  );

  return utf8Decode(decryptedBuf);
}

/* Повторная попытка (макс 3 раза) */
/* export async function decryptWithRetry (
 {encryptedMessage: { cipherTextB64, ivB64 },
  encryptedKeyB64,
  privateKey}:PropsDecryptMessage,
  maxAttempts = 3,
): Promise<string> {
  let lastErr: string;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await decryptMessageForOne({
        encryptedMessage: {
          cipherTextB64,
          ivB64,
        },
        encryptedKeyB64,
        privateKey,
      });
    } catch (e) {
      lastErr = e instanceof Error ? e.message : JSON.stringify(e);
      if (attempt === maxAttempts) break;

      // небольшая задержка — иногда помогает при гонках
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  throw lastErr;
}
 */
