import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchExpenses,
  insertExpense,
  deleteExpense as dbDelete,
  fetchBudgets,
  upsertBudget,
} from "@/lib/supabase";
import { currentMonthKey, todayISO } from "@/utils/helpers";

export function useExpenses() {
  const { user } = useAuth();

  const [expenses, setExpenses]   = useState([]);
  const [budgets,  setBudgets]    = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);

  const month = currentMonthKey();

  // ── Load ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [exp, bud] = await Promise.all([
        fetchExpenses(user.id),
        fetchBudgets(user.id, month),
      ]);
      setExpenses(exp);
      setBudgets(bud);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, month]);

  useEffect(() => { load(); }, [load]);

  // ── Add expense ───────────────────────────────────────────
  const addExpense = useCallback(async (fields) => {
    const row = {
      ...fields,
      user_id: user.id,
      date:    fields.date || todayISO(),
    };
    const saved = await insertExpense(row);
    setExpenses((prev) => [saved, ...prev]);
    return saved;
  }, [user]);

  // ── Delete expense ────────────────────────────────────────
  const removeExpense = useCallback(async (id) => {
    await dbDelete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Save budget ───────────────────────────────────────────
  const saveBudget = useCallback(async (category, limitAmount) => {
    const row = {
      user_id:      user.id,
      category,
      month,
      limit_amount: limitAmount,
    };
    const saved = await upsertBudget(row);
    setBudgets((prev) => {
      const idx = prev.findIndex(
        (b) => b.category === category && b.month === month
      );
      return idx >= 0
        ? prev.map((b, i) => (i === idx ? saved : b))
        : [...prev, saved];
    });
  }, [user, month]);

  return {
    expenses,
    budgets,
    loading,
    error,
    reload: load,
    addExpense,
    removeExpense,
    saveBudget,
  };
}
