import { z } from "zod";

/**
 * Схема публичного ключа RSA в формате JWK
 */
export const rsaPublicKeyJwkSchema = z.object({
  kty: z.optional(z.string()),
  e: z.optional(z.string()),
  n: z.optional(z.string()),
  alg: z.optional(z.string()),
  key_ops: z.optional(z.array(z.string())),
  ext: z.optional(z.boolean()),
});

export type RsaPublicKeyJwk = z.infer<typeof rsaPublicKeyJwkSchema>;

/**
 * Схема данных бэкапа приватного ключа
 */
export const privateKeyJwkSchema = z.object({
  encryptedPrivateKeyB64: z.string(),
  ivB64: z.string(),
  saltB64: z.string(),
  iterations: z.string(), // Минимальное безопасное количество итераций
});

export type privateKeyJwk = z.infer<typeof privateKeyJwkSchema>;

export type KeyRecord = {
  id: string;
  publicKeyJwk: RsaPublicKeyJwk;
  privateKeyJwk: privateKeyJwk;
};

/**
 * DTO для загрузки бэкапа приватного ключа
 */
export type JsonWebKeyPrivate = Omit<privateKeyJwk, "createdAt">;

export type JsonWebKeys = {
  id: string;
  publicKeyJwk: RsaPublicKeyJwk;
  privateKeyJwk: JsonWebKeyPrivate;
};
