import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key prefix:", supabaseKey?.slice(0, 20));

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example → .env.local and fill in your credentials."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Auth helpers ──────────────────────────────────────────────
export const signInWithEmail = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email, password) =>
  supabase.auth.signUp({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

// ── Expense helpers ───────────────────────────────────────────
export const fetchExpenses = async (userId) => {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
};

export const insertExpense = async (expense) => {
  const { data, error } = await supabase
    .from("expenses")
    .insert(expense)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteExpense = async (id) => {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
};

// ── Budget helpers ────────────────────────────────────────────
export const fetchBudgets = async (userId, month) => {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month);
  if (error) throw error;
  return data;
};

export const upsertBudget = async (budget) => {
  const { data, error } = await supabase
    .from("budgets")
    .upsert(budget, { onConflict: "user_id,category,month" })
    .select()
    .single();
  if (error) throw error;
  return data;
};
