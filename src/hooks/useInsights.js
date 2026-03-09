import { useState, useEffect } from "react";

const ML_API = import.meta.env.VITE_ML_API_URL || "http://localhost:8000";

export function useInsights(expenses, budgets) {
  const [insights, setInsights]         = useState([]);
  const [mode, setMode]                 = useState(null);     // "heuristic" | "ml"
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

    fetch(`${ML_API}/api/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expenses, budgets }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`ML API error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setInsights(data.insights);
        setMode(data.mode);
        setMonthsOfData(data.months_of_data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        // Silently degrade — app works fine without insights
        console.warn("ML API unavailable:", e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [expenses, budgets]);

  return { insights, mode, monthsOfData, loading, error };
}
