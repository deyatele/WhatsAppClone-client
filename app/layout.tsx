import { cookies } from "next/headers";
import AppWrapper from "./components/AppWrapper";
import { SocketProvider } from "./components/providers/SocketProvider";
import { ToastProvider } from "./components/providers/ToastProvider";
import { UserProvider } from "./components/providers/UserProvider";
import "./globals.css";
import { getUserIdFromToken } from "./lib/JWTVeriify";

export const metadata = {
  title: "Расскажи и ...",
  description:
    'Оставайтесь на связи с друзьями и родными с помощью приложения "Расскажи и ...". "Расскажи и ..." — это бесплатное приложение для простого, безопасного и надежного обмена сообщениями и совершения звонков. Доступно на телефонах по всему миру.',
  openGraph: {
    title: "Расскажи и ...",
    description:
      'Оставайтесь на связи с друзьями и родными с помощью приложения "Расскажи и ...". "Расскажи и ..." — это бесплатное приложение для простого, безопасного и надежного обмена сообщениями и совершения звонков. Доступно на телефонах по всему миру.',
    url: "https://example.com", // замените на реальный URL вашего сайта
    siteName: "Расскажи и ...",
    images: [
      {
        url: "https://example.com/og-image.jpg", // замените на реальный путь к изображению
        width: 1200,
        height: 630,
        alt: "Логотип приложения «Расскажи и ...»",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon-180.png", type: "image/png", sizes: "180x180" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/mask-icon.svg",
        color: "#FF0000",
      },
      { rel: "apple-touch-icon", url: "/apple-icon-180.png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const userId = await getUserIdFromToken(accessToken || "");
  return (
    <html lang="ru">
      <body>
        <ToastProvider>
          <UserProvider userId={userId}>
            <SocketProvider token={accessToken}>
              <AppWrapper>{children}</AppWrapper>
            </SocketProvider>
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
