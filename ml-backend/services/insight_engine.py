import pandas as pd
import numpy as np
from datetime import datetime, date
from models import Expense, Budget, Insight, InsightResponse

# ── Threshold: how many months before ML activates ───────────
ML_THRESHOLD_MONTHS = 3


def build_df(expenses: list[Expense]) -> pd.DataFrame:
    if not expenses:
        return pd.DataFrame()
    df = pd.DataFrame([e.model_dump() for e in expenses])
    df["date"]   = pd.to_datetime(df["date"])
    df["amount"] = df["amount"].astype(float)
    df["month"]  = df["date"].dt.to_period("M").astype(str)
    return df


def months_of_data(df: pd.DataFrame) -> int:
    if df.empty:
        return 0
    return df["month"].nunique()


# ════════════════════════════════════════════════════════════
#  HEURISTIC ENGINE  (sparse data — < 3 months)
# ════════════════════════════════════════════════════════════

def heuristic_insights(df: pd.DataFrame, budgets: list[Budget]) -> list[Insight]:
    insights = []
    now       = datetime.now()
    this_month = now.strftime("%Y-%m")
    last_month = (now.replace(day=1) - pd.DateOffset(months=1)).strftime("%Y-%m")

    day_of_month  = now.day
    days_in_month = pd.Timestamp(now.year, now.month, 1).days_in_month
    pace          = day_of_month / days_in_month

    this_df = df[df["month"] == this_month]
    last_df = df[df["month"] == last_month]

    this_spend = this_df.groupby("category")["amount"].sum().to_dict()
    last_spend = last_df.groupby("category")["amount"].sum().to_dict()

    # 1. Budget warnings
    for b in budgets:
        spent = this_spend.get(b.category, 0)
        pct   = spent / b.limit_amount if b.limit_amount else 0
        if pct >= 1.0:
            insights.append(Insight(
                type="danger",
                title=f"{b.category} budget exceeded",
                body=f"Spent ₹{spent:.0f} of ₹{b.limit_amount:.0f} limit — ₹{spent - b.limit_amount:.0f} over."
            ))
        elif pct >= 0.8:
            insights.append(Insight(
                type="warning",
                title=f"{b.category} nearing limit",
                body=f"{pct*100:.0f}% used — ₹{b.limit_amount - spent:.0f} remaining."
            ))

    # 2. Month-over-month spikes
    for cat, amount in this_spend.items():
        prev = last_spend.get(cat, 0)
        if prev and (amount - prev) / prev > 0.4:
            insights.append(Insight(
                type="info",
                title=f"{cat} up {((amount-prev)/prev*100):.0f}% vs last month",
                body=f"₹{amount:.0f} this month vs ₹{prev:.0f} last month."
            ))

    # 3. Projected overspend
    total_this  = this_df["amount"].sum()
    total_last  = last_df["amount"].sum()
    projected   = total_this / pace if pace > 0 else 0
    if total_last and projected > total_last * 1.25:
        insights.append(Insight(
            type="warning",
            title="Projected overspend this month",
            body=f"At current pace: ~₹{projected:.0f} vs ₹{total_last:.0f} last month."
        ))

    # 4. Simple recurring detection (same category, similar amount ±20%, multiple months)
    if df["month"].nunique() >= 2:
        for cat, grp in df.groupby("category"):
            monthly = grp.groupby("month")["amount"].sum()
            if len(monthly) >= 2:
                cv = monthly.std() / monthly.mean() if monthly.mean() else 1
                if cv < 0.2:
                    insights.append(Insight(
                        type="info",
                        title=f"Recurring: {cat}",
                        body=f"You spend ~₹{monthly.mean():.0f}/month on {cat} consistently."
                    ))

    return insights[:5]


# ════════════════════════════════════════════════════════════
#  ML ENGINE  (3+ months of data)
# ════════════════════════════════════════════════════════════

def ml_insights(df: pd.DataFrame, budgets: list[Budget]) -> list[Insight]:
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import LabelEncoder

    insights = []
    now        = datetime.now()
    this_month = now.strftime("%Y-%m")

    # ── 1. Spending forecast (linear regression per category) ──
    monthly_cat = (
        df.groupby(["month", "category"])["amount"]
        .sum()
        .reset_index()
    )

    for cat in df["category"].unique():
        cat_df = monthly_cat[monthly_cat["category"] == cat].copy()
        if len(cat_df) < 3:
            continue
        cat_df = cat_df.sort_values("month")
        cat_df["t"] = range(len(cat_df))

        X = cat_df[["t"]].values
        y = cat_df["amount"].values

        model = LinearRegression().fit(X, y)
        next_t     = np.array([[len(cat_df)]])
        forecast   = float(model.predict(next_t)[0])
        r2         = float(model.score(X, y))
        confidence = max(0.0, min(1.0, r2))

        if forecast > 0:
            trend = (forecast - y[-1]) / y[-1] if y[-1] else 0
            if trend > 0.15:
                insights.append(Insight(
                    type="warning",
                    title=f"{cat} forecast: ₹{forecast:.0f} next month",
                    body=f"Trend suggests {trend*100:.0f}% increase. Consider reviewing {cat} spend.",
                    confidence=round(confidence, 2)
                ))
            elif trend < -0.15:
                insights.append(Insight(
                    type="good",
                    title=f"{cat} spending declining",
                    body=f"Forecast ₹{forecast:.0f} next month — down {abs(trend)*100:.0f}%.",
                    confidence=round(confidence, 2)
                ))

    # ── 2. Anomaly detection (IQR method per category) ──
    this_df = df[df["month"] == this_month]
    for cat, grp in df.groupby("category"):
        hist = grp[grp["month"] != this_month]["amount"]
        if len(hist) < 4:
            continue
        Q1, Q3 = hist.quantile(0.25), hist.quantile(0.75)
        IQR    = Q3 - Q1
        upper  = Q3 + 1.5 * IQR

        anomalies = grp[(grp["month"] == this_month) & (grp["amount"] > upper)]
        for _, row in anomalies.iterrows():
            insights.append(Insight(
                type="danger",
                title=f"Unusual {cat} expense",
                body=f"₹{row['amount']:.0f} on {row['date'].strftime('%d %b')} is unusually high for {cat}.",
                confidence=0.85
            ))

    # ── 3. Recurring expense detection ──
    monthly_totals = df.groupby(["month", "category"])["amount"].sum().unstack(fill_value=0)
    for cat in monthly_totals.columns:
        series = monthly_totals[cat]
        if len(series) < 3:
            continue
        cv = series.std() / series.mean() if series.mean() else 1
        if cv < 0.15:
            insights.append(Insight(
                type="info",
                title=f"Recurring pattern: {cat}",
                body=f"Very consistent ₹{series.mean():.0f}/month spend detected on {cat}.",
                confidence=round(1 - cv, 2)
            ))

    # ── 4. Savings suggestion ──
    monthly_total = df.groupby("month")["amount"].sum()
    if len(monthly_total) >= 3:
        avg_spend  = monthly_total.mean()
        best_month = monthly_total.idxmin()
        best_amt   = monthly_total.min()
        potential  = avg_spend - best_amt
        if potential > 0:
            insights.append(Insight(
                type="good",
                title=f"Savings potential: ₹{potential:.0f}/month",
                body=f"Your best month was {best_month} (₹{best_amt:.0f}). Matching it saves ₹{potential:.0f} vs your average.",
                confidence=0.75
            ))

    # ── 5. Category optimization ──
    cat_totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    if len(cat_totals) >= 2:
        top_cat = cat_totals.index[0]
        top_pct = cat_totals.iloc[0] / cat_totals.sum() * 100
        if top_pct > 40:
            insights.append(Insight(
                type="info",
                title=f"{top_cat} is {top_pct:.0f}% of total spend",
                body=f"Reducing {top_cat} by 10% would save ₹{cat_totals.iloc[0]*0.1:.0f} overall.",
                confidence=0.9
            ))

    return insights[:6]


# ════════════════════════════════════════════════════════════
#  MAIN ENTRY POINT
# ════════════════════════════════════════════════════════════

def generate_insights(expenses: list[Expense], budgets: list[Budget]) -> InsightResponse:
    df     = build_df(expenses)
    months = months_of_data(df)

    if df.empty:
        return InsightResponse(insights=[], mode="heuristic", months_of_data=0)

    if months >= ML_THRESHOLD_MONTHS:
        insights = ml_insights(df, budgets)
        mode     = "ml"
    else:
        insights = heuristic_insights(df, budgets)
        mode     = "heuristic"

    return InsightResponse(
        insights=insights,
        mode=mode,
        months_of_data=months
    )
