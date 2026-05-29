import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from database.db import engine
from models.models import Base
from routes.upload import router as upload_router
from routes.analyze import router as analyze_router
from routes.results import router as results_router

load_dotenv()

# Create DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Resume Screener API", version="1.0.0")

# CORS — allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files statically
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(upload_router, tags=["Upload"])
app.include_router(analyze_router, tags=["Analyze"])
app.include_router(results_router, tags=["Results"])

@app.get("/health")
def health():
    return {"status": "ok"}
