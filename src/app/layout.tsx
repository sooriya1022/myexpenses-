import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { LanguageProvider } from "@/context/LanguageContext";
import LanguageWelcomeModal from "@/components/LanguageWelcomeModal";

export const metadata: Metadata = {
  title: "MyExpense - Personal Expense & Budget Tracker",
  description:
    "Track personal expenses, manage monthly budgets, and analyze spending in INR (₹) with secure full-stack data isolation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <LanguageProvider>
          <LanguageWelcomeModal />
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
