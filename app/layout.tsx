import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BolViva — Hinglish Voice Mock Viva",
  description:
    "Bolke seekho, bina dare. Hinglish me viva practice karo — AI sunega, score dega, aur sahi answer voice me sunayega. Built with Gnani AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
