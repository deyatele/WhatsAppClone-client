"use client";

import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { AuthForm } from "../components/AuthForm";
import { loginWithKeyVerification } from "../lib/crypto/auth";

// Схема валидации для формы входа
const loginSchema = z.object({
  identifier: z.string().min(1, "Требуется email или телефон"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
});

// Определение полей для формы
const formFields: Array<{
  name: "identifier" | "password";
  label: string;
  type: "text" | "password";
  placeholder?: string;
}> = [
  {
    name: "identifier",
    label: "Email или номер телефона",
    type: "text" as const,
    placeholder: "Введите email или номер телефона",
  },
  {
    name: "password",
    label: "Пароль",
    type: "password" as const,
    placeholder: "Введите пароль",
  },
];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  return (
    <AuthForm
      formFields={formFields}
      validationSchema={loginSchema}
      onSubmitAction={loginWithKeyVerification}
      formTitle="Вход в Расскажи и ..."
      buttonText="Войти"
      linkText="Нет аккаунта?"
      linkHref="/register"
      inviteToken={inviteToken}
    />
  );
}
