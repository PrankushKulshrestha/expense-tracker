from fastapi import APIRouter
from models import InsightRequest, InsightResponse
from services.insight_engine import generate_insights

router = APIRouter()

@router.post("/insights", response_model=InsightResponse)
def insights(req: InsightRequest):
    return generate_insights(req.expenses, req.budgets)
