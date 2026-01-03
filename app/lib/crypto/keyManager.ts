import { getMyKeysFromServer } from "../api";
import { log } from "../log";
/* Ключевой менеджер.
   Интерфейсы и экспорт функций:
   - generateAndStoreKeyPair(password, id?)
   - getPrivateKey(password, id)
   - getPublicJwk(id)
   - deleteKey(id)
   - fetchPrivateKeyFromServer(id, token)  <-- stub (сеть)
   
*/

import type { KeyRecord } from "./types/keys.types";

const DB_NAME = "crypto-store";
const STORE_NAME = "keys";
const DB_VERSION = 1;
const PBKDF2_ITERATIONS = 150000; // безопасная базовая настройка
const AES_GCM_PARAMS = { name: "AES-GCM", length: 256 } as const;
const RSA_GENERATE_PARAMS = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: "SHA-256" as const,
};
const RSA_IMPORT_PARAMS = { name: "RSA-OAEP", hash: "SHA-256" } as const;

function utf8Encode(s: string) {
  return new TextEncoder().encode(s);
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function base64ToArrayBuffer(b64: string) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(new Error("Ошибка IndexedDB"));
  });
}

export async function putRecord(record: KeyRecord) {
  const db = await openDb();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const r = store.put(record);
    r.onsuccess = () => res();
    r.onerror = () => rej(new Error("Ошибка записи в IndexedDB"));
  });
}

async function getRecord(id: string): Promise<KeyRecord | null> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const r = store.get(id);

    r.onsuccess = () => {
      if (!r.result) {
        getMyKeys(id).then((keys) => {
          if (keys) {
            return res(keys);
          } else {
            return rej(new Error("Ошибка чтения IndexedDB"));
          }
        });
      } else res(r.result ?? null);
    };
    r.onerror = async () => {
      getMyKeys(id).then((keys) => {
        if (keys) {
          return res(keys);
        } else {
          return rej(new Error("Ошибка чтения IndexedDB"));
        }
      });
    };
  });
}

async function getMyKeys(id: string): Promise<KeyRecord | null> {
  const keys = await getMyKeysFromServer(id);
  if (!keys) return null;
  await putRecord(keys);
  return keys;
}

async function getAllRecords(): Promise<KeyRecord[]> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const r = store.getAll();
    r.onsuccess = () => res(r.result ?? []);
    r.onerror = () => rej(new Error("Ошибка чтения IndexedDB"));
  });
}

async function deleteRecord(id: string) {
  const db = await openDb();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const r = store.delete(id);
    r.onsuccess = () => res();
    r.onerror = () => rej(new Error("Ошибка удаления из IndexedDB"));
  });
}

/* PBKDF2 -> AES-GCM вывод ключа */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number,
) {
  try {
    const pwKey = await crypto.subtle.importKey(
      "raw",
      utf8Encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array(salt),
        iterations,
        hash: "SHA-256",
      },
      pwKey,
      AES_GCM_PARAMS,
      false,
      ["encrypt", "decrypt"],
    );

    return key;
  } catch {
    throw new Error("Ошибка деривации ключа");
  }
}

/* Генерация RSA пары и её шифрование/сохранение */
export async function generateAndStoreKeyPair(
  password: string,
): Promise<Omit<KeyRecord, "id">> {
  try {
    const keyPair = await crypto.subtle.generateKey(RSA_GENERATE_PARAMS, true, [
      "encrypt",
      "decrypt",
    ]);

    const publicKeyJwk = (await crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey,
    )) as JsonWebKey;
    const privatePkcs8 = await crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey,
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = PBKDF2_ITERATIONS;

    const akey = await deriveKeyFromPassword(password, salt, iterations);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      akey,
      privatePkcs8,
    );

    const record: Omit<KeyRecord, "id"> = {
      publicKeyJwk,
      privateKeyJwk: {
        encryptedPrivateKeyB64: arrayBufferToBase64(encrypted),
        ivB64: arrayBufferToBase64(iv.buffer),
        saltB64: arrayBufferToBase64(salt.buffer),
        iterations: String(iterations),
      },
    };

    return record;
  } catch (e) {
    log(`ERROR: ${e}`);
    throw new Error(`ERROR: Не удалось сгенерировать и сохранить ключ: ${e}`);
  }
}

/* Получить публичный JWK */
export async function getPublicJwk(id: string): Promise<JsonWebKey | null> {
  const rec = await getRecord(id);
  return rec ? rec.publicKeyJwk : null;
}

/**
 * Найти локальную запись по публичному JWK (сравнивает n и e для RSA)
 * Возвращает id записи или null
 */
export async function findRecordIdByPublicJwk(
  publicKeyJwk: JsonWebKey,
): Promise<string | null> {
  if (!publicKeyJwk) return null;
  const records = await getAllRecords();
  for (const r of records) {
    const pj = r.publicKeyJwk;
    // Сравниваем по ключевым полям JWK
    if (
      pj &&
      pj.kty === publicKeyJwk.kty &&
      pj.n === publicKeyJwk.n &&
      pj.e === publicKeyJwk.e
    ) {
      return r.id;
    }
  }
  return null;
}

/* Получить приватный CryptoKey по паролю */
export async function getPrivateKey(
  password: string,
  id: string,
): Promise<CryptoKey> {
  const rec = await getRecord(id);
  if (!rec) throw new Error("Ключ не найден");

  try {
    const salt = new Uint8Array(base64ToArrayBuffer(rec.privateKeyJwk.saltB64));
    const iv = new Uint8Array(base64ToArrayBuffer(rec.privateKeyJwk.ivB64));
    const encrypted = base64ToArrayBuffer(
      rec.privateKeyJwk.encryptedPrivateKeyB64,
    );
    const akey = await deriveKeyFromPassword(
      password,
      salt,
      Number(rec.privateKeyJwk.iterations),
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      akey,
      encrypted,
    );

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      decrypted,
      RSA_IMPORT_PARAMS,
      false,
      ["decrypt"],
    );
    return privateKey;
  } catch (e) {
    throw new Error(`"Не удалось расшифровать приватный ключ" ${e}`);
  }
}

/* Удалить запись ключа */
export async function removeKey(id: string) {
  await deleteRecord(id);
}

/* Импорт приватного ключа с сервера и шифрование паролем */
export async function importPrivateKeyAndStore(
  pkcs8ArrayBuffer: ArrayBuffer,
  publicKeyJwk: JsonWebKey,
  password: string,
  keyId: string,
) {
  try {
    // проверяем, что приватный ключ можно импортировать
    await crypto.subtle.importKey(
      "pkcs8",
      pkcs8ArrayBuffer,
      RSA_IMPORT_PARAMS,
      false,
      ["decrypt"],
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = PBKDF2_ITERATIONS;
    const akey = await deriveKeyFromPassword(password, salt, iterations);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      akey,
      pkcs8ArrayBuffer,
    );

    const record: KeyRecord = {
      id: keyId,
      publicKeyJwk,
      privateKeyJwk: {
        encryptedPrivateKeyB64: arrayBufferToBase64(encrypted),
        ivB64: arrayBufferToBase64(iv.buffer),
        saltB64: arrayBufferToBase64(salt.buffer),
        iterations: String(iterations),
      },
    };
    await putRecord(record);
    return { id: keyId };
  } catch {
    throw new Error("Не удалось импортировать/сохранить приватный ключ");
  }
}

/**
 * Восстановить приватный ключ из бэкапа (серверного) и сохранить локально.
 * backup должен содержать: encryptedPrivateKeyB64, ivB64, saltB64, iterations, publicJwk?
 * Функция расшифрует приватный pkcs8 при помощи пароля и затем вызовет importPrivateKeyAndStore
 */
export async function restorePrivateKeyFromBackup(
  backup: Omit<KeyRecord, "id">,
  password: string,
  id: string,
) {
  try {
    const salt = new Uint8Array(
      base64ToArrayBuffer(backup.privateKeyJwk.saltB64),
    );
    const iv = new Uint8Array(base64ToArrayBuffer(backup.privateKeyJwk.ivB64));
    const encrypted = base64ToArrayBuffer(
      backup.privateKeyJwk.encryptedPrivateKeyB64,
    );

    const akey = await deriveKeyFromPassword(
      password,
      salt,
      Number(backup.privateKeyJwk.iterations),
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      akey,
      encrypted,
    );

    // decrypted - это pkcs8 ArrayBuffer
    const publicJwk = backup.publicKeyJwk ?? undefined;

    return await importPrivateKeyAndStore(
      decrypted,
      publicJwk as JsonWebKey,
      password,
      id,
    );
  } catch (e) {
    throw new Error(`Не удалось восстановить приватный ключ из бэкапа: ${e}`);
  }
}
