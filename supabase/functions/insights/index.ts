// supabase/functions/insights/index.ts

// ── CORS ──────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

// ── Types ─────────────────────────────────────────────────────
interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
  tags?: string[];
}

interface Budget {
  category: string;
  month: string;
  limit_amount: number;
}

interface Insight {
  type: "danger" | "warning" | "info" | "good";
  title: string;
  body: string;
  confidence?: number;
}

interface InsightResponse {
  insights: Insight[];
  mode: "heuristic" | "ml";
  months_of_data: number;
}

// ── Date helpers ──────────────────────────────────────────────
const monthKey = (dateStr: string): string => dateStr.slice(0, 7);

const currentMonth = (): string => new Date().toISOString().slice(0, 7);

const prevMonth = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

const daysInCurrentMonth = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

// ── Group expenses by month ────────────────────────────────────
const groupByMonth = (expenses: Expense[]): Record<string, Expense[]> => {
  return expenses.reduce((acc, e) => {
    const key = monthKey(e.date);
    acc[key] = [...(acc[key] ?? []), e];
    return acc;
  }, {} as Record<string, Expense[]>);
};

// ── Sum amounts by category ────────────────────────────────────
const spendByCategory = (expenses: Expense[]): Record<string, number> => {
  return expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);
};

// ── Count unique months ────────────────────────────────────────
const countMonths = (expenses: Expense[]): number => {
  return new Set(expenses.map((e) => monthKey(e.date))).size;
};

// ════════════════════════════════════════════════════════════════
//  HEURISTIC ENGINE  (< 3 months of data)
// ════════════════════════════════════════════════════════════════
function heuristicInsights(expenses: Expense[], budgets: Budget[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const thisMonth = currentMonth();
  const lastMonthKey = prevMonth();

  const dayOfMonth = now.getDate();
  const totalDays = daysInCurrentMonth();
  const pace = dayOfMonth / totalDays;

  const byMonth = groupByMonth(expenses);
  const thisExp = byMonth[thisMonth] ?? [];
  const lastExp = byMonth[lastMonthKey] ?? [];

  const thisSpend = spendByCategory(thisExp);
  const lastSpend = spendByCategory(lastExp);

  // 1. Budget warnings
  for (const b of budgets) {
    const spent = thisSpend[b.category] ?? 0;
    const pct = spent / b.limit_amount;
    if (pct >= 1.0) {
      insights.push({
        type: "danger",
        title: `${b.category} budget exceeded`,
        body: `Spent ₹${spent.toFixed(0)} of ₹${b.limit_amount} limit — ₹${(spent - b.limit_amount).toFixed(0)} over.`,
      });
    } else if (pct >= 0.8) {
      insights.push({
        type: "warning",
        title: `${b.category} nearing limit`,
        body: `${(pct * 100).toFixed(0)}% used — ₹${(b.limit_amount - spent).toFixed(0)} remaining.`,
      });
    }
  }

  // 2. Month-over-month spikes
  for (const [cat, amount] of Object.entries(thisSpend)) {
    const prev = lastSpend[cat] ?? 0;
    if (prev > 0 && (amount - prev) / prev > 0.4) {
      insights.push({
        type: "info",
        title: `${cat} up ${(((amount - prev) / prev) * 100).toFixed(0)}% vs last month`,
        body: `₹${amount.toFixed(0)} this month vs ₹${prev.toFixed(0)} last month.`,
      });
    }
  }

  // 3. Projected overspend
  const totalThis = thisExp.reduce((s, e) => s + Number(e.amount), 0);
  const totalLast = lastExp.reduce((s, e) => s + Number(e.amount), 0);
  const projected = pace > 0 ? totalThis / pace : 0;
  if (totalLast > 0 && projected > totalLast * 1.25) {
    insights.push({
      type: "warning",
      title: "Projected overspend this month",
      body: `At current pace: ~₹${projected.toFixed(0)} vs ₹${totalLast.toFixed(0)} last month.`,
    });
  }

  // 4. Simple recurring detection
  const months = Object.keys(byMonth);
  if (months.length >= 2) {
    const categories = [...new Set(expenses.map((e) => e.category))];
    for (const cat of categories) {
      const monthlyAmounts = months
        .map((m) => {
          const exp = byMonth[m] ?? [];
          return exp.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
        })
        .filter((a) => a > 0);

      if (monthlyAmounts.length >= 2) {
        const mean = monthlyAmounts.reduce((s, v) => s + v, 0) / monthlyAmounts.length;
        const std = Math.sqrt(
          monthlyAmounts.reduce((s, v) => s + (v - mean) ** 2, 0) / monthlyAmounts.length
        );
        const cv = mean > 0 ? std / mean : 1;
        if (cv < 0.2) {
          insights.push({
            type: "info",
            title: `Recurring: ${cat}`,
            body: `You spend ~₹${mean.toFixed(0)}/month on ${cat} consistently.`,
          });
        }
      }
    }
  }

  return insights.slice(0, 5);
}

// ════════════════════════════════════════════════════════════════
//  ML ENGINE  (3+ months of data)
// ════════════════════════════════════════════════════════════════
function linearRegression(y: number[]): { slope: number; intercept: number; r2: number } {
  const n = y.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = x.reduce((s, v) => s + v, 0) / n;
  const yMean = y.reduce((s, v) => s + v, 0) / n;

  const ssXX = x.reduce((s, v) => s + (v - xMean) ** 2, 0);
  const ssXY = x.reduce((s, v, i) => s + (v - xMean) * (y[i] - yMean), 0);
  const ssYY = y.reduce((s, v) => s + (v - yMean) ** 2, 0);

  const slope = ssXX !== 0 ? ssXY / ssXX : 0;
  const intercept = yMean - slope * xMean;
  const ssRes = y.reduce((s, v, i) => s + (v - (slope * x[i] + intercept)) ** 2, 0);
  const r2 = ssYY !== 0 ? Math.max(0, 1 - ssRes / ssYY) : 0;

  return { slope, intercept, r2 };
}

function mlInsights(expenses: Expense[], budgets: Budget[]): Insight[] {
  const insights: Insight[] = [];
  const thisMonth = currentMonth();

  const byMonth = groupByMonth(expenses);
  const allMonths = Object.keys(byMonth).sort();
  const categories = [...new Set(expenses.map((e) => e.category))];

  // 1. Spending forecast
  for (const cat of categories) {
    const monthlySeries = allMonths.map((m) => {
      const exp = byMonth[m] ?? [];
      return exp.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
    });

    if (monthlySeries.filter((v) => v > 0).length < 3) continue;

    const { slope, intercept, r2 } = linearRegression(monthlySeries);
    const forecast = slope * monthlySeries.length + intercept;
    const last = monthlySeries[monthlySeries.length - 1];
    const confidence = Math.min(1, Math.max(0, r2));

    if (forecast > 0 && last > 0) {
      const trend = (forecast - last) / last;
      if (trend > 0.15) {
        insights.push({
          type: "warning",
          title: `${cat} forecast: ₹${forecast.toFixed(0)} next month`,
          body: `Trend suggests ${(trend * 100).toFixed(0)}% increase. Consider reviewing ${cat} spend.`,
          confidence: Math.round(confidence * 100) / 100,
        });
      } else if (trend < -0.15) {
        insights.push({
          type: "good",
          title: `${cat} spending declining`,
          body: `Forecast ₹${forecast.toFixed(0)} next month — down ${(Math.abs(trend) * 100).toFixed(0)}%.`,
          confidence: Math.round(confidence * 100) / 100,
        });
      }
    }
  }

  // 2. Anomaly detection (IQR)
  const thisExp = byMonth[thisMonth] ?? [];
  for (const cat of categories) {
    const historical = expenses
      .filter((e) => monthKey(e.date) !== thisMonth && e.category === cat)
      .map((e) => Number(e.amount))
      .sort((a, b) => a - b);

    if (historical.length < 4) continue;

    const q1 = historical[Math.floor(historical.length * 0.25)];
    const q3 = historical[Math.floor(historical.length * 0.75)];
    const upper = q3 + 1.5 * (q3 - q1);

    const anomalies = thisExp.filter((e) => e.category === cat && Number(e.amount) > upper);
    for (const a of anomalies) {
      insights.push({
        type: "danger",
        title: `Unusual ${cat} expense`,
        body: `₹${Number(a.amount).toFixed(0)} on ${a.date} is unusually high for ${cat}.`,
        confidence: 0.85,
      });
    }
  }

  // 3. Recurring detection
  for (const cat of categories) {
    const monthlySeries = allMonths
      .map((m) => {
        const exp = byMonth[m] ?? [];
        return exp.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
      })
      .filter((v) => v > 0);

    if (monthlySeries.length < 3) continue;
    const mean = monthlySeries.reduce((s, v) => s + v, 0) / monthlySeries.length;
    const std = Math.sqrt(
      monthlySeries.reduce((s, v) => s + (v - mean) ** 2, 0) / monthlySeries.length
    );
    const cv = mean > 0 ? std / mean : 1;

    if (cv < 0.15) {
      insights.push({
        type: "info",
        title: `Recurring pattern: ${cat}`,
        body: `Very consistent ₹${mean.toFixed(0)}/month spend detected on ${cat}.`,
        confidence: Math.round((1 - cv) * 100) / 100,
      });
    }
  }

  // 4. Savings suggestion
  const monthlyTotals = allMonths.map((m) => ({
    month: m,
    total: (byMonth[m] ?? []).reduce((s, e) => s + Number(e.amount), 0),
  }));

  if (monthlyTotals.length >= 3) {
    const avg = monthlyTotals.reduce((s, v) => s + v.total, 0) / monthlyTotals.length;
    const best = monthlyTotals.reduce((min, v) => (v.total < min.total ? v : min));
    const potential = avg - best.total;
    if (potential > 0) {
      insights.push({
        type: "good",
        title: `Savings potential: ₹${potential.toFixed(0)}/month`,
        body: `Your best month was ${best.month} (₹${best.total.toFixed(0)}). Matching it saves ₹${potential.toFixed(0)} vs your average.`,
        confidence: 0.75,
      });
    }
  }

  // 5. Category optimization
  const catTotals = categories
    .map((cat) => ({
      cat,
      total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
    }))
    .sort((a, b) => b.total - a.total);

  if (catTotals.length >= 2) {
    const grandTotal = catTotals.reduce((s, v) => s + v.total, 0);
    const top = catTotals[0];
    const pct = grandTotal > 0 ? (top.total / grandTotal) * 100 : 0;
    if (pct > 40) {
      insights.push({
        type: "info",
        title: `${top.cat} is ${pct.toFixed(0)}% of total spend`,
        body: `Reducing ${top.cat} by 10% would save ₹${(top.total * 0.1).toFixed(0)} overall.`,
        confidence: 0.9,
      });
    }
  }

  // Budget warnings in ML mode too
  const thisSpend = spendByCategory(thisExp);
  for (const b of budgets) {
    const spent = thisSpend[b.category] ?? 0;
    const pct = spent / b.limit_amount;
    if (pct >= 1.0) {
      insights.push({
        type: "danger",
        title: `${b.category} budget exceeded`,
        body: `Spent ₹${spent.toFixed(0)} of ₹${b.limit_amount} limit — ₹${(spent - b.limit_amount).toFixed(0)} over.`,
      });
    }
  }

  return insights.slice(0, 6);
}

// ════════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ════════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { expenses, budgets } = await req.json() as {
      expenses: Expense[];
      budgets: Budget[];
    };

    if (!expenses?.length) {
      return new Response(
        JSON.stringify({ insights: [], mode: "heuristic", months_of_data: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const months = countMonths(expenses);
    const ML_THRESHOLD = 3;

    const result: InsightResponse =
      months >= ML_THRESHOLD
        ? { insights: mlInsights(expenses, budgets ?? []), mode: "ml", months_of_data: months }
        : { insights: heuristicInsights(expenses, budgets ?? []), mode: "heuristic", months_of_data: months };

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
