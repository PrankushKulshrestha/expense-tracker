from pydantic import BaseModel
from typing import Optional

class Expense(BaseModel):
    id: str
    date: str           # "YYYY-MM-DD"
    category: str
    amount: float
    note: Optional[str] = ""
    tags: Optional[list[str]] = []

class Budget(BaseModel):
    category: str
    month: str          # "YYYY-MM"
    limit_amount: float

class InsightRequest(BaseModel):
    expenses: list[Expense]
    budgets: list[Budget]

class Insight(BaseModel):
    type: str           # "danger" | "warning" | "info" | "good"
    title: str
    body: str
    confidence: Optional[float] = None   # 0-1, shown when ML is active

class InsightResponse(BaseModel):
    insights: list[Insight]
    mode: str           # "heuristic" | "ml"
    months_of_data: int
