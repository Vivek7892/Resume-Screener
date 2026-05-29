import csv, io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional

from database.db import get_db
from models.models import Candidate

router = APIRouter()

@router.get("/results")
def get_results(
    session_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("rank"),
    db: Session = Depends(get_db),
):
    q = db.query(Candidate)
    if session_id:
        q = q.filter(Candidate.session_id == session_id)
    if search:
        q = q.filter(Candidate.name.ilike(f"%{search}%"))

    sort_col = getattr(Candidate, sort_by, Candidate.rank)
    candidates = q.order_by(sort_col).all()

    return {
        "total": len(candidates),
        "candidates": [_serialize(c) for c in candidates],
    }

@router.get("/results/export")
def export_csv(session_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(Candidate)
    if session_id:
        q = q.filter(Candidate.session_id == session_id)
    candidates = q.order_by(Candidate.rank).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rank", "Name", "Filename", "Match Score",
                     "Matching Skills", "Missing Skills"])
    for c in candidates:
        writer.writerow([
            c.rank, c.name, c.filename, c.match_score,
            ", ".join(c.matching_skills or []),
            ", ".join(c.missing_skills or []),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidates.csv"},
    )

def _serialize(c: Candidate) -> dict:
    return {
        "id": c.id,
        "session_id": c.session_id,
        "name": c.name,
        "filename": c.filename,
        "skills": c.skills,
        "education": c.education,
        "experience": c.experience,
        "keywords": c.keywords,
        "match_score": c.match_score,
        "matching_skills": c.matching_skills,
        "missing_skills": c.missing_skills,
        "rank": c.rank,
        "created_at": str(c.created_at),
    }
