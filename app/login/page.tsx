"use client";

import { z } from "zod";
import { AuthForm } from "../components/AuthForm";
import { loginAction } from "../lib/serverActions";

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
  return (
    <AuthForm
      formFields={formFields}
      validationSchema={loginSchema}
      onSubmitAction={loginAction}
      formTitle="Вход в WhatsApp"
      buttonText="Войти"
      linkText="Нет аккаунта?"
      linkHref="/register"
    />
  );
}
