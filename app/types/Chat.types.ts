import z from "zod";
import { messageSchema } from "./Messages.types";


const participantUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  phone: z.string().optional(),
  email: z.string().nullable().optional(),
});

const participantSchema = z.object({
  user: participantUserSchema,
});

const chatSchema = z.object({
  id: z.string(),
  createdAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  updatedAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  participants: z.array(participantSchema),
  messages: z.array(messageSchema).optional(),
});

export interface PaginationState {
  cursor?: string;
  hasMore: boolean;
  isLoading: boolean;
}

export const chatsResponseSchema = z.array(chatSchema);

export type Chat = z.infer<typeof chatSchema>;

export type ChatParticipant = z.infer<typeof participantUserSchema>;