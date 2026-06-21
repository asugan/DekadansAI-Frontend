import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppNav } from "./app-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dekadans AI | Multi-Model AI Gateway",
  description:
    "Weekly request-limited access to MiniMax, GLM, Kimi, and ChatGPT through one secure API key. Plans from $5/week.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
