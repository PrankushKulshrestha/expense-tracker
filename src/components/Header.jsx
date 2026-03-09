import React from "react";
import { Moon, Sun, Download, LogOut } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { signOut } from "@/lib/supabase";
import { exportExpensesToCSV } from "@/utils/helpers";

export default function Header({ expenses }) {
  const { dark, toggle } = useTheme();

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 text-base font-bold">
          ₹
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 leading-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Expense Tracker
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">Personal Finance Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => exportExpensesToCSV(expenses)}
          title="Export CSV"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition"
        >
          <Download size={15} />
        </button>

        <button
          onClick={toggle}
          title="Toggle theme"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button
          onClick={signOut}
          title="Sign out"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
