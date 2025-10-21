import z from "zod";
import { userBaseSchema, timestampSchema } from "./Common.types";

export const userSchema = z.object({
  ...userBaseSchema.shape,
  phone: z.string(), 
  isOnline: z.boolean(),
  lastSeen: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type User = z.infer<typeof userSchema>;