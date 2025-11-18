"use client";

import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { AuthForm } from "../components/AuthForm";
import { generateAndStoreKeyPair } from "../lib/crypto/keyManager";
import { registerAction } from "../lib/serverActions";

// Схема валидации для формы регистрации
const registerSchema = z.object({
  phone: z.string().min(1, "Требуется номер телефона"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
  name: z.string().optional(),
  email: z
    .string()
    .regex(z.regexes.email, "Неверный формат email")
    .optional()
    .or(z.literal("")),
});

// Определение полей для формы
const formFields: Array<{
  name: "phone" | "password" | "name" | "email";
  label: string;
  type: "tel" | "password" | "text" | "email";
  placeholder?: string;
}> = [
  {
    name: "phone",
    label: "Номер телефона",
    type: "tel" as const,
    placeholder: "Введите номер телефона",
  },
  {
    name: "password",
    label: "Пароль",
    type: "password" as const,
    placeholder: "Введите пароль",
  },
  {
    name: "name",
    label: "Имя",
    type: "text" as const,
    placeholder: "Введите ваше имя",
  },
  {
    name: "email",
    label: "Email",
    type: "email" as const,
    placeholder: "Введите ваш email (необязательно)",
  },
];

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  type RegisterFormData = z.infer<typeof registerSchema>;
  type RegisterResult = { success: boolean; error?: string } | undefined;

  const handleRegister = async (
    data: RegisterFormData,
  ): Promise<RegisterResult> => {
    try {
      const { privateKeyBackup, publicKeyJwk } = await generateAndStoreKeyPair(
        data.password,
      );
      return await registerAction({ ...data, privateKeyBackup, publicKeyJwk });
    } catch (e) {
      console.error("Ошибка генерации ключей:", e);
      return { success: false, error: "Ошибка генерации ключей" };
    }
  };

  return (
    <AuthForm
      formFields={formFields}
      validationSchema={registerSchema}
      onSubmitAction={handleRegister}
      formTitle="Создать аккаунт"
      buttonText="Зарегистрироваться"
      linkText="Уже есть аккаунт?"
      linkHref="/login"
      inviteToken={inviteToken}
    />
  );
}
