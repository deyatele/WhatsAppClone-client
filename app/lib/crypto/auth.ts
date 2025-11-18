import type { LoginResult } from "../../types";
import type { LoginDto } from "../api";
import { loginAction } from "../serverActions";
import {
  findRecordIdByPublicJwk,
  generateAndStoreKeyPair,
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
      console.error("[loginWithKeyVerification] loginAction threw:", e);
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
console.log(user)
      if (user.publicKeyJwk) {
        localId = await findRecordIdByPublicJwk(user.publicKeyJwk);
        console.log("Found local key ID:", localId);
      }

      if (!localId && user.publicKeyJwk && user.privateKeyJwk) {
        try {
          const { id } = await restorePrivateKeyFromBackup(
            {
              publicKeyJwk: user.publicKeyJwk,
              privateKeyBackup: user.privateKeyJwk,
              id: user.id,
            },
            dto.password,
            user.id
          );
          localId = id;
        } catch (error) {
          console.log(error);
        }
      }

      if (!localId) {
        const { id: newId, ...keyPairRec } = await generateAndStoreKeyPair(
          dto.password,
          user.id,
        );

        console.log("Generating new key pair");
        console.log(keyPairRec);
        const updResult = await updateMyKeysClient(
          keyPairRec,
          loginResult.accessToken,
          user.id,
        );

        console.log("updResult", updResult);

        if (updResult && typeof updResult === "object" && !updResult.success) {
          await removeKey(newId).catch((e) => {
            console.log(e);
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
      console.error("Ошибка проверки ключей:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Ошибка проверки ключей",
      };
    }
  } catch (error) {
    console.error("Login Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка входа",
    };
  }
}
