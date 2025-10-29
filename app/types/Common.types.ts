import z from "zod";

export const timestampSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Invalid date string",
  });

export const userBaseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  phone: z.string().optional(),
  email: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

export type UserBase = z.infer<typeof userBaseSchema>;
