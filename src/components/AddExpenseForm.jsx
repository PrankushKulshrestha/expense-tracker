import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { CATEGORIES, todayISO, cn } from "@/utils/helpers";

const EMPTY = {
  date: todayISO(),
  category: "Food",
  amount: "",
  note: "",
  tags: "",
};

export default function AddExpenseForm({ onAdd, loading }) {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Enter a valid amount."); return;
    }
    setBusy(true); setError("");
    try {
      await onAdd({
        ...form,
        amount: Number(form.amount),
        tags:   form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setForm(EMPTY);
      setOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 text-sm font-medium shadow-xl shadow-neutral-900/20"
      >
        <Plus size={16} />
        Add Expense
      </motion.button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-50 max-w-lg mx-auto bg-white dark:bg-neutral-900 rounded-t-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  New Expense
                </h2>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Amount */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => set("amount", e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>

                {/* Category */}
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => set("category", c.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs transition border",
                        form.category === c.id
                          ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                          : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400"
                      )}
                    >
                      <span>{c.emoji}</span>
                      <span>{c.id}</span>
                    </button>
                  ))}
                </div>

                {/* Date + Note */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Note (optional)"
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>

                {/* Tags */}
                <input
                  type="text"
                  placeholder="Tags, comma-separated (e.g. lunch, work)"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  onClick={submit}
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 transition"
                >
                  {busy ? "Saving…" : "Save Expense"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
