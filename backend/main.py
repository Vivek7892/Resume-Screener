import os
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from database.db import engine, test_connection
from models.models import Base
from routes.upload import router as upload_router
from routes.analyze import router as analyze_router
from routes.results import router as results_router

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Resume Screener API", version="1.0.0")

# ── CORS ─────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static uploads ────────────────────────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload_router, tags=["Upload"])
app.include_router(analyze_router, tags=["Analyze"])
app.include_router(results_router, tags=["Results"])


# ── Global error handler — always returns JSON with full detail ───────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"{exc}\n\n{traceback.format_exc()}"},
    )


@app.on_event("startup")
def on_startup():
    test_connection()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/debug/name")
def debug_name(path: str):
    """Test name extraction on a saved resume path."""
    from utils.parser import extract_text, extract_name
    abs_path = os.path.normpath(path)
    if not os.path.exists(abs_path):
        return {"error": f"File not found: {abs_path}"}
    raw = extract_text(abs_path)
    name = extract_name(raw)
    top_lines = [l.strip() for l in raw.split("\n") if l.strip()][:15]
    return {"extracted_name": name, "top_lines": top_lines}
