import os
import uuid
import traceback
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
    jd_text: Optional[str] = None
    jd_file_path: Optional[str] = None
    resume_paths: List[str]


def _resolve_path(path: str) -> str:
    """
    Normalise and resolve a file path to absolute.
    Handles Windows backslashes, forward slashes, and relative paths.
    """
    # Normalise all separators to the OS separator
    path = os.path.normpath(path)
    if not os.path.isabs(path):
        # Relative → resolve from backend/ directory (where main.py lives)
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(backend_dir, path)
    return os.path.normpath(path)


@router.post("/analyze")
def analyze(req: AnalyzeRequest, db: Session = Depends(get_db)):
    try:
        # ── Resolve JD ───────────────────────────────────────────────────────
        if req.jd_text:
            jd_text = req.jd_text
        elif req.jd_file_path:
            jd_path = _resolve_path(req.jd_file_path)
            if not os.path.exists(jd_path):
                raise HTTPException(status_code=400, detail=f"JD file not found: {jd_path}")
            jd_text = extract_text(jd_path)
        else:
            raise HTTPException(status_code=400, detail="Provide jd_text or jd_file_path")

        if not jd_text.strip():
            raise HTTPException(status_code=400, detail="JD text is empty")

        # Persist JD
        try:
            jd_record = JobDescription(content=jd_text)
            db.add(jd_record)
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"DB error saving JD: {e}")

        jd_skills = extract_skills(jd_text)
        session_id = uuid.uuid4().hex
        results = []
        errors = []

        for raw_path in req.resume_paths:
            abs_path = _resolve_path(raw_path)

            if not os.path.exists(abs_path):
                errors.append(f"File not found: {abs_path}")
                continue

            # Extract text
            try:
                raw = extract_text(abs_path)
            except Exception as e:
                errors.append(f"Text extraction failed [{os.path.basename(abs_path)}]: {e}")
                continue

            if not raw or not raw.strip():
                errors.append(f"Empty text [{os.path.basename(abs_path)}]: file may be image-based or corrupted")
                continue

            # Parse & score
            try:
                name       = extract_name(raw)
                skills     = extract_skills(raw)
                education  = extract_education(raw)
                experience = extract_experience(raw)
                keywords   = extract_keywords(raw)
                scores     = score_candidate(raw, jd_text, skills, jd_skills)
            except Exception as e:
                errors.append(f"Parsing failed [{os.path.basename(abs_path)}]: {e}")
                continue

            # Save to DB
            try:
                candidate = Candidate(
                    session_id=session_id,
                    name=name,
                    filename=os.path.basename(abs_path),
                    file_path=abs_path,
                    raw_text=raw[:5000],
                    skills=skills,
                    education=education,
                    experience=experience,
                    keywords=keywords,
                    match_score=scores["match_score"],
                    matching_skills=scores["matching_skills"],
                    missing_skills=scores["missing_skills"],
                    skills_score=scores["skills_score"],
                    semantic_score=scores["semantic_score"],
                    experience_score=scores["experience_score"],
                    education_score=scores["education_score"],
                )
                db.add(candidate)
                db.commit()
                db.refresh(candidate)
                results.append({**candidate.__dict__, **scores})
            except Exception as e:
                db.rollback()
                errors.append(f"DB save failed [{os.path.basename(abs_path)}]: {e}")
                continue

        if not results:
            detail = "No resumes could be processed."
            if errors:
                detail += " | " + " | ".join(errors)
            raise HTTPException(status_code=422, detail=detail)

        # Rank
        results.sort(key=lambda x: x["match_score"], reverse=True)
        for i, r in enumerate(results, 1):
            db.query(Candidate).filter(Candidate.id == r["id"]).update({"rank": i})
            r["rank"] = i
        db.commit()

        clean = [{k: v for k, v in r.items() if k != "_sa_instance_state"} for r in results]
        return {
            "session_id": session_id,
            "total": len(clean),
            "candidates": clean,
            "warnings": errors or None,
        }

    except HTTPException:
        raise
    except Exception as e:
        # Return full traceback so you can see exactly what crashed
        raise HTTPException(status_code=500, detail=f"{e}\n\n{traceback.format_exc()}")
