import { z } from "zod";
import {
  type AuthResponse,
  authResponseSchema,
  type Chat,
  chatsResponseSchema,
  type Message,
  messagesResponseSchema,
  type User,
  userSchema,
} from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type RegisterDto = {
  phone: string;
  password: string;
  email?: string;
  name?: string;
};

export type LoginDto = {
  identifier: string;
  password: string;
};

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const fetchOptions: RequestInit & { agent?: object } = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // Node-only dev agent
  if (process.versions?.node && process.env.NODE_ENV === "development") {
    const https = await import("node:https");
    fetchOptions.agent = new https.Agent({
      rejectUnauthorized: false,
    });
  }
  const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Что-то пошло не так");
  }
  return await response.json();
}

export const authApi = {
  async register(dto: RegisterDto): Promise<User> {
    const data = await fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(dto),
    });
    return userSchema.parse(data);
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    const data = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(dto),
    });
    return authResponseSchema.parse(data);
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const data = await fetchApi("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    return z.object({ accessToken: z.string() }).parse(data);
  },
};

const paginatedMessagesSchema = z.object({
  messages: messagesResponseSchema,
  nextCursor: z.string().nullable(),
});

export const chatApi = {
  async getMyChats(token: string): Promise<Chat[]> {
    const data = await fetchApi("/chats/my", {
      headers: { Authorization: `Bearer ${token}` },
    });   
    return chatsResponseSchema.parse(data);
  },

  async getMessages(
    chatId: string,
    cursor?: string,
    limit = 15,
  ): Promise<{ messages: Message[]; nextCursor: string | null }> {
    const url = new URL(`/api/messages/${chatId}`, window.location.origin);
    url.searchParams.append("limit", String(limit));
    if (cursor) {
      url.searchParams.append("cursor", cursor);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch messages");
    }
    const data = await response.json();
    return paginatedMessagesSchema.parse(data);
  },
  
};
