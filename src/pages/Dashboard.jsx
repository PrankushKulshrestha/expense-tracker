import React from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import SummarySection from "@/components/SummarySection";
import InsightsPanel from "@/components/InsightsPanel";
import ChartsSection from "@/components/ChartsSection";
import BudgetSection from "@/components/BudgetSection";
import ExpenseTable from "@/components/ExpenseTable";
import AddExpenseForm from "@/components/AddExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";

export default function Dashboard() {
  const {
    expenses, budgets, loading, error,
    addExpense, removeExpense, saveBudget,
  } = useExpenses();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent animate-spin" />
          <p className="text-sm text-neutral-400">Loading your expenses…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24 space-y-8">
        <Header expenses={expenses} />

        {error && (
          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <SummarySection expenses={expenses} />
        <InsightsPanel  expenses={expenses} budgets={budgets} />
        <ChartsSection  expenses={expenses} />
        <BudgetSection  expenses={expenses} budgets={budgets} onSaveBudget={saveBudget} />
        <ExpenseTable   expenses={expenses} onDelete={removeExpense} />
      </div>

      <AddExpenseForm onAdd={addExpense} />
    </div>
  );
}
