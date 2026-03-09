import React, { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { CATEGORIES, spendByCategory, currentMonthKey, monthLabel, cn } from "@/utils/helpers";

function BudgetRow({ cat, spent, budget, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(budget?.limit_amount ?? "");
  const [busy, setBusy]       = useState(false);

  const limit = budget?.limit_amount ?? null;
  const pct   = limit ? Math.min((spent / limit) * 100, 100) : null;
  const over  = limit && spent > limit;
  const warn  = limit && pct >= 80 && !over;

  const save = async () => {
    if (!val || isNaN(Number(val)) || Number(val) <= 0) return;
    setBusy(true);
    await onSave(cat.id, Number(val));
    setBusy(false);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cat.emoji}</span>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{cat.id}</p>
            <p className="text-xs text-neutral-400">
              ₹{spent.toLocaleString("en-IN", { maximumFractionDigits: 0 })} spent
              {limit ? ` / ₹${limit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : ""}
            </p>
          </div>
        </div>

        {editing ? (
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">₹</span>
              <input
                autoFocus
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                className="w-28 pl-6 pr-2 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <button onClick={save} disabled={busy}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs">
              {busy ? "…" : <Check size={12} />}
            </button>
            <button onClick={() => { setEditing(false); setVal(budget?.limit_amount ?? ""); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500">
              <X size={12} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition">
            <Pencil size={13} />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {limit ? (
        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "h-full rounded-full",
              over ? "bg-red-500" : warn ? "bg-amber-400" : "bg-emerald-500"
            )}
          />
        </div>
      ) : (
        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
          <div className="h-full w-0" />
        </div>
      )}

      {over && (
        <p className="text-xs text-red-500 font-medium">
          Over by ₹{(spent - limit).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </p>
      )}
    </div>
  );
}

export default function BudgetSection({ expenses, budgets, onSaveBudget }) {
  const thisMonthExp  = expenses.filter(
    (e) => e.date?.startsWith(currentMonthKey())
  );
  const spendMap = spendByCategory(thisMonthExp);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Budgets
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {monthLabel(currentMonthKey())} · Click ✏️ to set a limit
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const budget = budgets.find((b) => b.category === cat.id) ?? null;
          return (
            <BudgetRow
              key={cat.id}
              cat={cat}
              spent={spendMap[cat.id] ?? 0}
              budget={budget}
              onSave={onSaveBudget}
            />
          );
        })}
      </div>
    </section>
  );
}
