import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, CheckCircle, Loader2, WifiOff } from "lucide-react";
import { useInsights } from "@/hooks/useInsights";

const ICONS = {
  danger:  <AlertTriangle size={15} className="text-red-500   shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />,
  info:    <TrendingUp    size={15} className="text-blue-500  shrink-0 mt-0.5" />,
  good:    <CheckCircle   size={15} className="text-emerald-500 shrink-0 mt-0.5" />,
};

const BG = {
  danger:  "bg-red-50    dark:bg-red-900/20   border-red-100    dark:border-red-800/40",
  warning: "bg-amber-50  dark:bg-amber-900/20  border-amber-100  dark:border-amber-800/40",
  info:    "bg-blue-50   dark:bg-blue-900/20   border-blue-100   dark:border-blue-800/40",
  good:    "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40",
};

export default function InsightsPanel({ expenses, budgets }) {
  const { insights, mode, monthsOfData, loading, error } = useInsights(expenses, budgets);

  const modeLabel = mode === "ml"
    ? `ML active · ${monthsOfData} months of data`
    : monthsOfData > 0
    ? `Heuristic · ML activates at 3 months (${3 - monthsOfData} to go)`
    : null;

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Insights
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 size={14} className="animate-spin" />
          Analysing your spending…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Insights
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3">
          <WifiOff size={13} />
          ML backend offline — start the FastAPI server to see insights.
        </div>
      </section>
    );
  }

  if (!insights.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Insights
        </h2>
        {modeLabel && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            mode === "ml"
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
          }`}>
            {modeLabel}
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className={`border rounded-2xl p-4 flex gap-3 ${BG[ins.type]}`}
          >
            {ICONS[ins.type] ?? ICONS.info}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {ins.title}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {ins.body}
              </p>
              {ins.confidence != null && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-500 dark:bg-neutral-400 rounded-full"
                      style={{ width: `${ins.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {Math.round(ins.confidence * 100)}% confidence
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
