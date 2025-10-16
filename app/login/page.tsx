"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { LoginDto } from "../lib/api";
import { loginAction } from "../lib/clientActions";

const loginSchema = z.object({
  identifier: z.string().min(1, "Требуется email или телефон"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setServerError(null);
    const dto: LoginDto = {
      identifier: data.identifier,
      password: data.password,
    };
    const result = await loginAction(dto);
    if (result && !result.success) {
      setServerError(result.error || "Произошла неизвестная ошибка");
    }
    return result;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-white">
          Вход в WhatsApp
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-300"
            >
              Email или номер телефона
            </label>
            <input
              id="identifier"
              type="text"
              {...register("identifier")}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            {errors.identifier && (
              <p className="mt-2 text-sm text-red-500">
                {errors.identifier.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
          {serverError && (
            <p className="text-sm text-center text-red-500">{serverError}</p>
          )}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Войти
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-400">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-medium text-green-500 hover:underline"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
