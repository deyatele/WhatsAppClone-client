"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import type { SubmitHandler, FieldValues } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Loader } from "./Loader";

// Определяем типы для пропсов
interface FormField {
  name: string;
  label: string;
  type: "text" | "password" | "email" | "tel";
  placeholder?: string;
}

interface AuthFormProps<T extends FieldValues> {
  formFields: FormField[];
  validationSchema: z.Schema<T>;
  onSubmitAction: (data: T) => Promise<any>;
  formTitle: string;
  buttonText: string;
  linkText: string;
  linkHref: string;
}

export function AuthForm<T extends FieldValues>({
  formFields,
  validationSchema,
  onSubmitAction,
  formTitle,
  buttonText,
  linkText,
  linkHref,
}: AuthFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<T>({ resolver: zodResolver(validationSchema) });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<T> = async (data) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(data);
      if (result && !result.success) {
        setServerError(result.error || "Произошла неизвестная ошибка");
      }
    } catch (error) {
      setServerError("Произошла непредвиденная ошибка.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-white">
          {formTitle}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {formFields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-300"
              >
                {field.label}
              </label>
              <input
                id={field.name}
                type={field.type}
                {...register(field.name as any)}
                className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder={field.placeholder}
                disabled={isSubmitting}
              />
              {errors[field.name] && (
                <p className="mt-2 text-sm text-red-500">
                  {errors[field.name]?.message as string}
                </p>
              )}
            </div>
          ))}

          {serverError && (
            <p className="text-sm text-center text-red-500">{serverError}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-800 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader /> : buttonText}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-400">
          {linkText}{" "}
          <Link
            href={linkHref}
            className={`font-medium text-green-500 ${isSubmitting ? "pointer-events-none" : "hover:underline"}`}>
            {linkHref === "/login" ? "Войти" : "Зарегистрироваться"}
          </Link>
        </p>
      </div>
    </div>
  );
}