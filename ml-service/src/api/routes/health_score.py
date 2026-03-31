"""
Health Score computation — derives a 0-100 score from transaction data
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import structlog

logger = structlog.get_logger()
router = APIRouter()


class TransactionInput(BaseModel):
    amount: float
    category: str
    is_recurring: bool = False


class HealthScoreRequest(BaseModel):
    transactions: List[TransactionInput]
    monthly_income: Optional[float] = None


class HealthScoreResponse(BaseModel):
    score: float
    grade: str
    components: dict
    insights: List[str]
    disclaimer: str


def compute_health_score(transactions: List[TransactionInput], monthly_income: Optional[float]) -> HealthScoreResponse:
    if not transactions:
        return HealthScoreResponse(
            score=50.0, grade="C",
            components={"savings_rate": 50, "expense_diversity": 50, "recurring_control": 50},
            insights=["Upload your bank statement to get a personalized health score."],
            disclaimer="Score is based on available transaction data only."
        )

    income = sum(t.amount for t in transactions if t.amount > 0)
    expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)

    if monthly_income:
        income = max(income, monthly_income)

    # Component 1: Savings rate (0-40 points)
    savings = income - expenses
    savings_rate = savings / income if income > 0 else 0
    savings_score = min(40, max(0, savings_rate * 100))  # 40% savings = full score

    # Component 2: Expense diversity (0-30 points) — penalize over-concentration
    category_totals: dict = {}
    for t in transactions:
        if t.amount < 0:
            category_totals[t.category] = category_totals.get(t.category, 0) + abs(t.amount)

    diversity_score = 30.0
    if expenses > 0 and category_totals:
        max_category_pct = max(category_totals.values()) / expenses
        if max_category_pct > 0.5:
            diversity_score = 30 * (1 - max_category_pct)  # penalize if >50% in one category

    # Component 3: Recurring control (0-30 points) — recurring should be <40% of expenses
    recurring_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0 and t.is_recurring)
    recurring_ratio = recurring_expenses / expenses if expenses > 0 else 0
    recurring_score = 30 * max(0, 1 - max(0, recurring_ratio - 0.4) * 2.5)

    total = round(savings_score + diversity_score + recurring_score, 1)

    # Grade
    grade = "A" if total >= 80 else "B" if total >= 65 else "C" if total >= 50 else "D"

    # Insights
    insights = []
    if savings_rate < 0.1:
        insights.append(f"Your savings rate is {savings_rate*100:.1f}%. Aim for at least 20% to build wealth.")
    elif savings_rate >= 0.3:
        insights.append(f"Excellent savings rate of {savings_rate*100:.1f}%! Keep it up.")
    if recurring_ratio > 0.4:
        insights.append(f"Recurring expenses are {recurring_ratio*100:.1f}% of spending. Review subscriptions.")
    if len(category_totals) >= 5:
        insights.append("Good expense diversity across multiple categories.")
    if not insights:
        insights.append("Your finances look healthy. Keep tracking to maintain your score.")

    return HealthScoreResponse(
        score=total,
        grade=grade,
        components={
            "savings_rate": round(savings_score, 1),
            "expense_diversity": round(diversity_score, 1),
            "recurring_control": round(recurring_score, 1),
        },
        insights=insights,
        disclaimer="Score is educational and based on uploaded transaction data only."
    )


@router.post("/health-score", summary="Calculate financial health score", response_model=HealthScoreResponse)
async def calculate_health_score(request: HealthScoreRequest) -> HealthScoreResponse:
    try:
        logger.info("Computing health score", transaction_count=len(request.transactions))
        result = compute_health_score(request.transactions, request.monthly_income)
        logger.info("Health score computed", score=result.score, grade=result.grade)
        return result
    except Exception as e:
        logger.error("Health score computation failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Health score computation failed: {str(e)}")
