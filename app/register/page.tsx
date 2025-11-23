"use client";

import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { AuthForm } from "../components/AuthForm";
import { generateAndStoreKeyPair, putRecord } from "../lib/crypto/keyManager";
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
      const { privateKeyJwk, publicKeyJwk } = await generateAndStoreKeyPair(
        data.password,
      );

      const user = await registerAction({
        ...data,
        privateKeyJwk,
        publicKeyJwk,
      });
      if ("error" in user && !user.success) throw new Error(user.error);

      if ("id" in user) {
        try {
          await putRecord({ id: user.id, privateKeyJwk, publicKeyJwk });
        } catch (error) {
          console.error(error);
          throw new Error(
            error instanceof Error ? error.message : JSON.stringify(error),
          );
        }
      } else throw new Error("Данные с сервера не коректны. Нет userId");

      return { success: true };
      
    } catch (e) {
      console.error("Ошибка регистрации", e);
      return {
        success: false,
        error: e instanceof Error ? e.message : JSON.stringify(e),
      };
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
