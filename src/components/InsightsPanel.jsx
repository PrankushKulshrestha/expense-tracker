import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, Info, CheckCircle } from "lucide-react";
import { generateInsights } from "@/utils/helpers";

const ICONS = {
  danger:  <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />,
  info:    <TrendingUp    size={15} className="text-blue-500  shrink-0 mt-0.5" />,
  good:    <CheckCircle   size={15} className="text-emerald-500 shrink-0 mt-0.5" />,
};

const BG = {
  danger:  "bg-red-50    dark:bg-red-900/20  border-red-100   dark:border-red-800/40",
  warning: "bg-amber-50  dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40",
  info:    "bg-blue-50   dark:bg-blue-900/20  border-blue-100  dark:border-blue-800/40",
  good:    "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40",
};

export default function InsightsPanel({ expenses, budgets }) {
  const insights = generateInsights(expenses, budgets);

  if (!insights.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Insights
        </h2>
        <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full">
          Auto-generated · ML coming soon
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className={`border rounded-2xl p-4 flex gap-3 ${BG[ins.type]}`}
          >
            {ICONS[ins.type] ?? ICONS.info}
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {ins.title}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {ins.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
