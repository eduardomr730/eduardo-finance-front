import type { Metadata } from "next";

import { APP_NAME } from "@/lib/constants";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Personal finance operating system para Espana con foco en salario, autonomo e impuestos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
