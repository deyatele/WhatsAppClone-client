import z from "zod";
import { timestampSchema, userBaseSchema } from "./Common.types";
import { messageSchema } from "./Messages.types";

const participantSchema = z.object({
  user: userBaseSchema,
});

const chatSchema = z.object({
  id: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
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
export type ChatParticipant = z.infer<typeof userBaseSchema>;
