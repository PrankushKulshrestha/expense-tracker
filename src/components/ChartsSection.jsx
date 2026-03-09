import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, parseISO, subMonths, startOfMonth } from "date-fns";
import { CATEGORIES, CATEGORY_MAP, monthKey, cn } from "@/utils/helpers";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-neutral-700 dark:text-neutral-200 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          ₹{Number(p.value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
};

export default function ChartsSection({ expenses }) {
  const [tab, setTab] = useState("trend"); // "trend" | "category"

  // Last 6 months trend
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d   = subMonths(new Date(), 5 - i);
      const key = format(d, "yyyy-MM");
      const total = expenses
        .filter((e) => monthKey(e.date) === key)
        .reduce((s, e) => s + Number(e.amount), 0);
      return { month: format(d, "MMM"), total };
    });
  }, [expenses]);

  // Category breakdown (this month)
  const thisMonth = format(new Date(), "yyyy-MM");
  const categoryData = useMemo(() => {
    const spend = {};
    expenses
      .filter((e) => monthKey(e.date) === thisMonth)
      .forEach((e) => { spend[e.category] = (spend[e.category] ?? 0) + Number(e.amount); });
    return CATEGORIES
      .map((c) => ({ name: c.id, value: spend[c.id] ?? 0, color: c.color, emoji: c.emoji }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses, thisMonth]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Analytics
        </h2>
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          {[["trend", "Trend"], ["category", "By Category"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition",
                tab === key
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5">
        {tab === "trend" ? (
          <div>
            <p className="text-xs text-neutral-400 mb-4">Monthly spending — last 6 months</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
                <Bar dataKey="total" fill="#171717" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : categoryData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-neutral-400">
            No expenses this month yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  dataKey="value" paddingAngle={3}>
                  {categoryData.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2.5">
              {categoryData.map((c) => {
                const total = categoryData.reduce((s, x) => s + x.value, 0);
                const pct   = total ? (c.value / total * 100).toFixed(1) : 0;
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-600 dark:text-neutral-300">
                        {c.emoji} {c.name}
                      </span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        ₹{c.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
