"use client";

import { z } from "zod";

import { registerAction } from "../lib/clientActions";
import { AuthForm } from "../components/AuthForm";

// Схема валидации для формы регистрации
const registerSchema = z.object({
  phone: z.string().min(1, "Требуется номер телефона"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
  name: z.string().optional(),
  email: z.string().email("Неверный формат email").optional().or(z.literal("")),
});

// Определение полей для формы
const formFields = [
  {
    name: "phone",
    label: "Номер телефона",
    type: "tel" as const,
  },
  {
    name: "password",
    label: "Пароль",
    type: "password" as const,
  },
  {
    name: "name",
    label: "Имя (опционально)",
    type: "text" as const,
  },
  {
    name: "email",
    label: "Email (опционально)",
    type: "email" as const,
  },
];

export default function RegisterPage() {
  return (
    <AuthForm
      formFields={formFields}
      validationSchema={registerSchema}
      onSubmitAction={registerAction}
      formTitle="Создать аккаунт"
      buttonText="Зарегистрироваться"
      linkText="Уже есть аккаунт?"
      linkHref="/login"
    />
  );
}