import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Klesch AI Contract Analyser",
  description: "Secure, fast, and intelligent contract analysis.",
  keywords: "AI, contract analysis, legal documents, document summarization, legal tech",
  authors: [{ name: "AI Contract Summarizer Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#60a5fa" },
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
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(0,0,0,0))]"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.02) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}