import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useInsights(expenses, budgets) {
  const [insights, setInsights]         = useState([]);
  const [mode, setMode]                 = useState(null);
  const [monthsOfData, setMonthsOfData] = useState(0);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    if (!expenses?.length) {
      setInsights([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Call Supabase Edge Function — no separate server needed
    supabase.functions
      .invoke("insights", {
        body: { expenses, budgets: budgets ?? [] },
      })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) throw err;
        setInsights(data.insights ?? []);
        setMode(data.mode);
        setMonthsOfData(data.months_of_data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        console.warn("Insights unavailable:", e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [expenses, budgets]);

  return { insights, mode, monthsOfData, loading, error };
}
