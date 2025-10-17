import z from "zod";


export const userSchema = z.object({
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



export type User = z.infer<typeof userSchema>;