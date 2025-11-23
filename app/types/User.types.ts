import z from "zod";
import { privateKeyJwkSchema } from "../lib/crypto/types/keys.types";
import { timestampSchema, userBaseSchema } from "./Common.types";

export const userSchema = z.object({
  ...userBaseSchema.shape,
  phone: z.string(),
  isOnline: z.boolean(),
  lastSeen: timestampSchema.nullable(),
  privateKeyJwk: privateKeyJwkSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type User = z.infer<typeof userSchema>;

export type LoginResult = {
  success: boolean;
  user?: User;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
};
