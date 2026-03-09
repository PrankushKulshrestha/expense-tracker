# 💰 Expense Tracker

A clean, minimal personal finance dashboard built with **React + Tailwind CSS** and **Supabase** (Postgres backend).

---

## Features

- 🔐 **Auth** — Email/password via Supabase Auth with Row-Level Security
- 📊 **Charts** — Monthly trend bar chart + per-category donut/breakdown
- 🎯 **Budgets** — Set per-category monthly limits with live progress bars
- 💡 **Insights** — Auto-generated spend alerts (budget warnings, MoM spikes, projected overspend)
- 🌙 **Dark mode** — System-aware toggle, persisted to localStorage
- 📥 **CSV export** — One-click download of all your expenses
- 🏷️ **Tags & search** — Filter transactions by category, keyword, or tag
- 🔮 **ML-ready** — `generateInsights()` in `helpers.js` is designed to be swapped for a real ML endpoint later

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd expense-tracker
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New Query**, paste the contents of `supabase/schema.sql`, and run it
3. Go to **Project Settings → API** and copy your Project URL and `anon` key

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run

```bash
npm run dev
```

---

## Project Structure

```
src/
  components/
    Header.jsx          ← Nav bar: theme toggle, CSV export, sign out
    SummarySection.jsx  ← 4 KPI tiles (this month, last month, avg/day, biggest)
    InsightsPanel.jsx   ← Auto-generated spend advice cards
    ChartsSection.jsx   ← Monthly bar chart + category donut
    BudgetSection.jsx   ← Per-category budget limits with progress bars
    ExpenseTable.jsx    ← Searchable, filterable transaction list
    AddExpenseForm.jsx  ← Slide-up drawer FAB
  context/
    AuthContext.jsx     ← Supabase session state
    ThemeContext.jsx    ← Dark/light mode
  hooks/
    useExpenses.js      ← All data fetching & mutations
  lib/
    supabase.js         ← Supabase client + typed DB helpers
  pages/
    AuthPage.jsx        ← Sign in / sign up
    Dashboard.jsx       ← Main app layout
  utils/
    helpers.js          ← Constants, date utils, CSV, cn(), insight engine
```

---

## Adding the ML Insights Layer (future)

The `generateInsights(expenses, budgets)` function in `src/utils/helpers.js` currently uses
heuristics. To plug in a real ML model:

1. Create a Supabase Edge Function (or any API endpoint) that accepts the `monthly_category_totals` view data
2. Call it from `InsightsPanel.jsx` instead of `generateInsights()`
3. The `monthly_category_totals` view is already in `schema.sql` — it aggregates spend per user/month/category, perfect for time-series forecasting

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 + DM Sans / Playfair Display |
| Animation | Framer Motion |
| Charts | Recharts |
| Backend | Supabase (Postgres + Auth + RLS) |
| Icons | Lucide React |
