import { z } from "zod";
import {
  type AuthResponse,
  authResponseSchema,
  type ChatCreateResponse,
  type ChatResponse,
  chatCreateShemaResponse,
  chatsResponseSchema,
  type MessageResponse,
  messagesResponseSchema,
  type User,
  userSchema,
} from "../types";
import {
  type JsonWebKeyPrivate,
  type KeyRecord,
  keysRecordSchema,
} from "./crypto/types/keys.types";

const API_URL = process.env.API_URL;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type RegisterDto = {
  phone: string;
  password: string;
  email?: string;
  name?: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKeyPrivate;
};

export type LoginDto = {
  identifier: string;
  password: string;
};

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const fetchOptions: RequestInit & { agent?: object } = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };
  if (process.versions?.node && process.env.NODE_ENV === "development") {
    const https = await import("node:https");
    fetchOptions.agent = new https.Agent({
      rejectUnauthorized: false,
    });
  }
  const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    let msg = response.statusText || "Server error";

    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;

      if ("message" in p && typeof p.message === "string") {
        msg = p.message;
      } else if (
        "message" in p &&
        Array.isArray(p.message) &&
        typeof p.message[0] === "string"
      ) {
        msg = p.message.join(", ");
      } else if (
        "error" in p &&
        typeof p.error === "object" &&
        p.error !== null &&
        "message" in p.error &&
        typeof (p.error as Record<string, unknown>).message === "string"
      ) {
        msg = (p.error as Record<string, unknown>).message as string;
      }
    }

    throw new Error(msg);
  }

  // Accept both API response shapes: { data: T } or direct T
  if (parsed && typeof parsed === "object") {
    const p = parsed as Record<string, unknown>;
    if (Object.hasOwn(p, "data")) {
      return p.data as T;
    }
  }

  return parsed as T;
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

  async validatePassword(password: string): Promise<void> {
    await fetchApi("/auth/validate-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },
};

const paginatedMessagesSchema = z.object({
  messages: messagesResponseSchema,
  nextCursor: z.string().nullable(),
});

export const chatApi = {
  async createChat(
    ovnerUserId: string | null,
    inviteToken: string | null,
  ): Promise<ChatCreateResponse | null> {
    if (!ovnerUserId) return null;
    try {
      const fetchOptions: RequestInit & { agent?: object } = {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ ovnerUserId, inviteToken }),
      };

      const response = await fetch(
        `${BASE_URL}/api/chats/create`,
        fetchOptions,
      );
      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message);

      return chatCreateShemaResponse.parse(jsonData);
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async getInviteToken(): Promise<{ id: string }> {
    const response = await fetch(`${BASE_URL}/api/chats/invite`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET",
    });
    const jsonData = await response.json();
    return z.object({ id: z.string() }).parse(jsonData);
  },

  async getUserInviteChat(tokenId: string): Promise<{ userId: string }> {
    const response = await fetch(`${BASE_URL}/api/chats/invite`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ tokenId }),
    });

    const jsonData = await response.json();
    return z.object({ userId: z.string() }).parse(jsonData);
  },

  async getMyChats(token: string): Promise<ChatResponse[]> {
    const data = await fetchApi("/chats/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return chatsResponseSchema.parse(data);
  },

  async getMessages(
    chatId: string,
    cursor?: string,
    limit = 15,
  ): Promise<{ messages: MessageResponse[]; nextCursor: string | null }> {

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

export async function getMyKeysFromServer(
  id: string,
): Promise<KeyRecord | null> {
  const response = await fetch(`${BASE_URL}/api/users/${id}/keys`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "GET",
  });
  const jsonData = await response.json();

  return keysRecordSchema.parse(jsonData);
}
