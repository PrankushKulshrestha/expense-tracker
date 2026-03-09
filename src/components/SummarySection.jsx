import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, CreditCard, Calendar } from "lucide-react";
import { format, parseISO, startOfMonth } from "date-fns";
import { monthKey } from "@/utils/helpers";

const tile = (i) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
});

export default function SummarySection({ expenses }) {
  const now       = new Date();
  const thisMonth = format(now, "yyyy-MM");
  const lastMonth = format(new Date(now.getFullYear(), now.getMonth() - 1), "yyyy-MM");

  const thisExp  = expenses.filter((e) => monthKey(e.date) === thisMonth);
  const lastExp  = expenses.filter((e) => monthKey(e.date) === lastMonth);

  const sum      = (arr) => arr.reduce((s, e) => s + Number(e.amount), 0);
  const thisTotal = sum(thisExp);
  const lastTotal = sum(lastExp);
  const delta     = lastTotal ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

  const largest = thisExp.reduce(
    (max, e) => (Number(e.amount) > Number(max?.amount ?? 0) ? e : max),
    null
  );

  const avgPerDay = (() => {
    const day = now.getDate();
    return day > 0 ? thisTotal / day : 0;
  })();

  const cards = [
    {
      label: "This Month",
      value: `₹${thisTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,
      sub: lastTotal
        ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs last month`
        : "No prior data",
      icon: <CreditCard size={16} />,
      trend: delta,
    },
    {
      label: "Last Month",
      value: `₹${lastTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,
      sub: format(new Date(now.getFullYear(), now.getMonth() - 1), "MMMM yyyy"),
      icon: <Calendar size={16} />,
      trend: null,
    },
    {
      label: "Avg / Day",
      value: `₹${avgPerDay.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      sub: `Based on ${now.getDate()} days`,
      icon: <TrendingUp size={16} />,
      trend: null,
    },
    {
      label: "Biggest Spend",
      value: largest ? `₹${Number(largest.amount).toLocaleString("en-IN")}` : "—",
      sub: largest ? `${largest.category} · ${largest.date}` : "No expenses yet",
      icon: <TrendingDown size={16} />,
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <motion.div key={c.label} {...tile(i)}>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium tracking-wide uppercase">
                {c.label}
              </span>
              <span className="text-neutral-400 dark:text-neutral-500">{c.icon}</span>
            </div>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 tracking-tight"
               style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {c.value}
            </p>
            <p className={`mt-1 text-xs ${
              c.trend != null
                ? c.trend > 0
                  ? "text-red-500"
                  : c.trend < 0
                  ? "text-emerald-500"
                  : "text-neutral-400"
                : "text-neutral-400 dark:text-neutral-500"
            }`}>
              {c.sub}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
