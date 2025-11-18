import z from "zod";
import { timestampSchema, userBaseSchema } from "./Common.types";

export const messageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  message: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedSender: z.boolean(),
  deletedReceiver: z.boolean(),
  sender: userBaseSchema,
  senderId: z.string(),
});

export type Message = z.infer<typeof messageSchema>;

export const messageSendSchema = z.object({
  encryptedMessage: z.object({
    cipherTextB64: z.string(),
    ivB64: z.string(),
  }),
  encryptedKeyForSender: z.string(),
  encryptedKeyForReceiver: z.string(),
});

export type MessageSend = z.infer<typeof messageSendSchema>;

export const messageEncryptedSchema = messageSchema.extend({
  encryptedMessage: messageSendSchema,
});

export const messagesResponseSchema = z.array(
  messageEncryptedSchema.omit({ message: true }),
);

export type MessageResponse = Omit<
  z.infer<typeof messageEncryptedSchema>,
  "message"
>;
