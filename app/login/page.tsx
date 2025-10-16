"use client";

import { z } from "zod";

import { loginAction } from "../lib/clientActions";
import { AuthForm } from "../components/AuthForm";

// Схема валидации для формы входа
const loginSchema = z.object({
  identifier: z.string().min(1, "Требуется email или телефон"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
});

// Определение полей для формы
const formFields = [
  {
    name: "identifier",
    label: "Email или номер телефона",
    type: "text" as const,
  },
  {
    name: "password",
    label: "Пароль",
    type: "password" as const,
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