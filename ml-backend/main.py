from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import insights

app = FastAPI(title="Expense Tracker ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(insights.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}
