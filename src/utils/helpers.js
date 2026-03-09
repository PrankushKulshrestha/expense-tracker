import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";

// ── Class names ───────────────────────────────────────────────
export const cn = (...inputs) => twMerge(clsx(inputs));

// ── Categories ────────────────────────────────────────────────
export const CATEGORIES = [
  { id: "Food",        emoji: "🍜", color: "#f97316" },
  { id: "Travel",      emoji: "✈️",  color: "#3b82f6" },
  { id: "Shopping",    emoji: "🛍️",  color: "#a855f7" },
  { id: "Bills",       emoji: "📋", color: "#ef4444" },
  { id: "Health",      emoji: "💊", color: "#22c55e" },
  { id: "Entertainment", emoji: "🎬", color: "#eab308" },
  { id: "Other",       emoji: "📦", color: "#6b7280" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.id);

// ── Date helpers ──────────────────────────────────────────────
export const monthKey    = (dateStr) => format(parseISO(dateStr), "yyyy-MM");
export const monthLabel  = (key)     => format(parseISO(`${key}-01`), "MMMM yyyy");
export const todayISO    = ()        => format(new Date(), "yyyy-MM-dd");
export const currentMonthKey = ()    => format(new Date(), "yyyy-MM");

// ── CSV export ────────────────────────────────────────────────
export function exportExpensesToCSV(expenses = []) {
  if (!expenses.length) { alert("No expenses to export!"); return; }

  const headers = ["Date", "Category", "Amount", "Note", "Tags"];
  const rows    = expenses.map((e) => [
    e.date,
    e.category,
    Number(e.amount).toFixed(2),
    e.note ?? "",
    (e.tags ?? []).join(" "),
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), {
    href: url, download: "expenses.csv", style: "display:none",
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Budget helpers ────────────────────────────────────────────
export function spendByCategory(expenses) {
  return expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});
}

// ── Insight engine (local heuristics — ML layer comes later) ──
export function generateInsights(expenses, budgets) {
  const insights = [];
  if (!expenses.length) return insights;

  const now         = new Date();
  const thisMonth   = format(now, "yyyy-MM");
  const dayOfMonth  = now.getDate();
  const daysInMonth = endOfMonth(now).getDate();
  const paceRatio   = dayOfMonth / daysInMonth;

  const thisMonthExp = expenses.filter((e) => monthKey(e.date) === thisMonth);
  const lastMonthKey = format(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)), "yyyy-MM");
  const lastMonthExp = expenses.filter((e) => monthKey(e.date) === lastMonthKey);

  const thisSpend = spendByCategory(thisMonthExp);
  const lastSpend = spendByCategory(lastMonthExp);

  // 1. Budget warnings
  budgets.forEach((b) => {
    const spent = thisSpend[b.category] ?? 0;
    const pct   = spent / b.limit_amount;
    if (pct >= 1) {
      insights.push({
        type: "danger",
        title: `${b.category} budget exceeded`,
        body:  `You've spent ₹${spent.toFixed(0)} of your ₹${b.limit_amount} limit.`,
      });
    } else if (pct >= 0.8) {
      insights.push({
        type: "warning",
        title: `${b.category} nearing limit`,
        body:  `${Math.round(pct * 100)}% used — ₹${(b.limit_amount - spent).toFixed(0)} left.`,
      });
    }
  });

  // 2. Month-over-month spikes
  Object.keys(thisSpend).forEach((cat) => {
    const delta = thisSpend[cat] - (lastSpend[cat] ?? 0);
    if (lastSpend[cat] && delta / lastSpend[cat] > 0.4) {
      insights.push({
        type: "info",
        title: `${cat} up ${Math.round((delta / lastSpend[cat]) * 100)}% vs last month`,
        body:  `₹${thisSpend[cat].toFixed(0)} this month vs ₹${lastSpend[cat].toFixed(0)} last month.`,
      });
    }
  });

  // 3. Projected overspend
  const totalThisMonth = thisMonthExp.reduce((s, e) => s + Number(e.amount), 0);
  const projected      = totalThisMonth / paceRatio;
  const totalLastMonth = lastMonthExp.reduce((s, e) => s + Number(e.amount), 0);
  if (totalLastMonth && projected > totalLastMonth * 1.25) {
    insights.push({
      type: "warning",
      title: "Projected overspend this month",
      body:  `At current pace you'll spend ~₹${projected.toFixed(0)} — 25%+ more than last month.`,
    });
  }

  return insights.slice(0, 4); // cap to 4 cards
}
