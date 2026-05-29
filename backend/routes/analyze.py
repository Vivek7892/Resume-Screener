import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from database.db import get_db
from models.models import Candidate, JobDescription
from utils.parser import extract_text, extract_name, extract_education, extract_experience
from utils.nlp import extract_skills, extract_keywords, score_candidate

router = APIRouter()

class AnalyzeRequest(BaseModel):
    jd_text: Optional[str] = None          # pasted JD
    jd_file_path: Optional[str] = None     # uploaded JD path
    resume_paths: List[str]                # list of saved resume paths

@router.post("/analyze")
def analyze(req: AnalyzeRequest, db: Session = Depends(get_db)):
    # ── Resolve JD text ──────────────────────────────────────────────────────
    if req.jd_text:
        jd_text = req.jd_text
    elif req.jd_file_path:
        jd_text = extract_text(req.jd_file_path)
    else:
        raise HTTPException(status_code=400, detail="Provide jd_text or jd_file_path")

    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="JD text is empty")

    # Persist JD
    jd_record = JobDescription(content=jd_text)
    db.add(jd_record)
    db.commit()

    jd_skills = extract_skills(jd_text)
    session_id = uuid.uuid4().hex

    results = []
    for path in req.resume_paths:
        try:
            raw = extract_text(path)
        except Exception as e:
            continue  # skip unreadable files

        name = extract_name(raw)
        skills = extract_skills(raw)
        education = extract_education(raw)
        experience = extract_experience(raw)
        keywords = extract_keywords(raw)
        scores = score_candidate(raw, jd_text, skills, jd_skills)

        candidate = Candidate(
            session_id=session_id,
            name=name,
            filename=path.split("/")[-1].split("\\")[-1],
            file_path=path,
            raw_text=raw[:5000],   # store first 5k chars
            skills=skills,
            education=education,
            experience=experience,
            keywords=keywords,
            match_score=scores["match_score"],
            matching_skills=scores["matching_skills"],
            missing_skills=scores["missing_skills"],
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        results.append({**candidate.__dict__, **scores})

    # Rank by score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    for i, r in enumerate(results, 1):
        db.query(Candidate).filter(Candidate.id == r["id"]).update({"rank": i})
        r["rank"] = i
    db.commit()

    # Clean SQLAlchemy internal key
    clean = [{k: v for k, v in r.items() if k != "_sa_instance_state"} for r in results]
    return {"session_id": session_id, "total": len(clean), "candidates": clean}
