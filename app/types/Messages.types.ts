import z from "zod";


export const messageSenderSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  phone: z.string().optional(),
  email: z.string().nullable().optional(),
});

export const messageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  content: z.string(),
  createdAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  updatedAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  deletedSender: z.boolean(),
  deletedReceiver: z.boolean(),
  sender: messageSenderSchema, // Use the simplified sender schema
  senderId: z.string(),
});

export const messagesResponseSchema = z.array(messageSchema);
export type Message = z.infer<typeof messageSchema>;