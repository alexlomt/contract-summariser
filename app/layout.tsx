import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Contract Summarizer - Intelligent Legal Document Analysis",
  description: "Transform complex legal documents into clear, actionable insights with our advanced AI technology. Secure, fast, and intelligent contract analysis.",
  keywords: "AI, contract analysis, legal documents, document summarization, legal tech",
  authors: [{ name: "AI Contract Summarizer Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#60a5fa" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased">
        {children}
      </body>
    </html>
  );
}