import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Search, Filter } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP, cn } from "@/utils/helpers";
import { format, parseISO } from "date-fns";

export default function ExpenseTable({ expenses, onDelete }) {
  const [search,   setSearch]   = useState("");
  const [catFilter, setCat]     = useState("All");
  const [deleting,  setDeleting] = useState(null);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat  = catFilter === "All" || e.category === catFilter;
      const matchText = !search ||
        e.note?.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchText;
    });
  }, [expenses, search, catFilter]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await onDelete(id); }
    finally { setDeleting(null); }
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mr-auto"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Transactions
        </h2>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-8 pr-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 w-44"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...CATEGORIES.map((c) => c.id)].map((cat) => (
            <button
              key={cat}
              onClick={() => setCat(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition border",
                catFilter === cat
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-400"
              )}
            >
              {cat === "All" ? cat : CATEGORY_MAP[cat]?.emoji + " " + cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-400">
            {expenses.length === 0 ? "No expenses yet. Add your first one!" : "No results for this filter."}
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
            <AnimatePresence initial={false}>
              {filtered.map((e) => {
                const cat = CATEGORY_MAP[e.category];
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition group"
                  >
                    {/* Emoji bubble */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: cat?.color + "18" }}
                    >
                      {cat?.emoji ?? "📦"}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {e.note || e.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-400">
                          {format(parseISO(e.date), "d MMM yyyy")}
                        </span>
                        {(e.tags ?? []).slice(0, 2).map((t) => (
                          <span key={t} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Amount */}
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 shrink-0">
                      ₹{Number(e.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deleting === e.id}
                      className="opacity-0 group-hover:opacity-100 transition w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
