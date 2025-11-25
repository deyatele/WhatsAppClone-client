import type { LoginResult } from "../../types";
import type { LoginDto } from "../api";
import { log } from "../log";
import { loginAction } from "../serverActions";
import {
  findRecordIdByPublicJwk,
  generateAndStoreKeyPair,
  putRecord,
  removeKey,
  restorePrivateKeyFromBackup,
} from "./keyManager";
import type { JsonWebKeys } from "./types/keys.types";

export async function updateMyKeysClient(
  keyPair: Omit<JsonWebKeys, "id">,
  token: string,
  id: string,
) {
  const res = await fetch(`/api/users/${id}/keys`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(keyPair),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function loginWithKeyVerification(dto: LoginDto) {
  try {
    // 1. Выполняем обычный вход через server action
    let loginResult: LoginResult;
    try {
      loginResult = await loginAction(dto);
    } catch (e) {
      log(`ERROR: [loginWithKeyVerification] loginAction threw: ${e}`);
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }

    if (!loginResult.success) return loginResult;

    if (!loginResult.user || !loginResult.accessToken)
      return { success: false, error: "Данные пользователя не найдены" };

    // 2. Проверка ключей
    try {
      const user = loginResult.user;
      let localId: string | null = null;
      if (user.publicKeyJwk) {
        localId = await findRecordIdByPublicJwk(user.publicKeyJwk);
      }

      if (!localId && user.publicKeyJwk && user.privateKeyJwk) {
        try {
          const { id } = await restorePrivateKeyFromBackup(
            {
              publicKeyJwk: user.publicKeyJwk,
              privateKeyJwk: user.privateKeyJwk,
            },
            dto.password,
            user.id,
          );
          localId = id;
        } catch (error) {
          log(`ERROR: ${error}`);
        }
      }

      if (!localId) {
        const keyPairRec = await generateAndStoreKeyPair(dto.password);
        await putRecord({ id: user.id, ...keyPairRec });

        const updResult = await updateMyKeysClient(
          keyPairRec,
          loginResult.accessToken,
          user.id,
        );

        if (updResult && typeof updResult === "object" && !updResult.success) {
          await removeKey(user.id).catch((e) => {
            log(`ERROR: ${e}`);
          });
          return {
            success: false,
            error: updResult.error || "Сервер недоступен",
            status: 500,
          };
        }
      }

      return { success: true };
    } catch (err) {
      log(`ERROR: Ошибка проверки ключей: ${err}`);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Ошибка проверки ключей",
      };
    }
  } catch (error) {
    log(`ERROR: Ошибка входа: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка входа",
    };
  }
}
