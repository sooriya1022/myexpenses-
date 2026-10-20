import { Wallet } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Wallet className="h-4 w-4" />
            </div>
            <span>{APP_NAME} &bull; Personal Finance Tracker</span>
          </div>

          <p className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {APP_NAME}. Built with Next.js, Prisma & PostgreSQL. Default currency in INR (₹).
          </p>
        </div>
      </div>
    </footer>
  );
}
