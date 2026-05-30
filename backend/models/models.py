from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from sqlalchemy.sql import func
from database.db import Base

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True)
    name = Column(String(255))
    filename = Column(String(255))
    file_path = Column(String(500))
    raw_text = Column(Text)
    skills = Column(JSON, default=[])
    education = Column(JSON, default=[])
    experience = Column(JSON, default=[])
    keywords = Column(JSON, default=[])
    match_score = Column(Float, default=0.0)
    matching_skills = Column(JSON, default=[])
    missing_skills = Column(JSON, default=[])
    skills_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    rank = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
