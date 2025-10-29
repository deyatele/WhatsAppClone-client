import z from "zod";
import { timestampSchema, userBaseSchema } from "./Common.types";

export const messageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  content: z.string(), // Вернули content
  encryptedPayload: z.string().optional(), // Сделали опциональным
  text: z.string().optional(), // Добавлено для расшифрованного содержимого
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedSender: z.boolean(),
  deletedReceiver: z.boolean(),
  sender: userBaseSchema,
  senderId: z.string(),
});

export const messagesResponseSchema = z.array(messageSchema);
export type Message = z.infer<typeof messageSchema>;
