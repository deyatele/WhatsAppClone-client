import https from "node:https";

import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const devAgent = new https.Agent({
  rejectUnauthorized: false,
});

const userSchema = z.object({
  id: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  isOnline: z.boolean(),
  lastSeen: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)))
    .nullable(),
  createdAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  updatedAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
});

const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userSchema,
});

export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

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

const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  sender: z.object({ id: z.string(), name: z.string().nullable() }),
});

const participantSchema = z.object({
  user: z.object({ id: z.string(), name: z.string().nullable() }),
});

const chatSchema = z.object({
  id: z.string(),
  createdAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  updatedAt: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  participants: z.array(participantSchema),
  messages: z.array(messageSchema),
});

export const chatsResponseSchema = z.array(chatSchema);

export type Chat = z.infer<typeof chatSchema>;

interface NodeFetchRequestInit extends RequestInit {
  agent?: import("https").Agent;
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const fetchOptions: NodeFetchRequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // Node-only dev agent
  if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
    fetchOptions.agent = devAgent;
  }
  const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Что-то пошло не так");
  }

  return response.json();
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

export const chatApi = {
  async getMyChats(token: string): Promise<Chat[]> {
    const data = await fetchApi("/chats/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return chatsResponseSchema.parse(data);
  },
};
