"""
Skill extraction and NLP scoring utilities.
Scoring weights: Skills 50% | Experience 25% | Education 15% | Keywords 10%
"""
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from utils.parser import clean_text

# ── Skill taxonomy ────────────────────────────────────────────────────────────
SKILL_PATTERNS = [
    # Languages
    "python", "java", "javascript", "typescript", "c\\+\\+", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r",
    # Web
    "react", "next\\.js", "vue", "angular", "node\\.js", "express", "django",
    "fastapi", "flask", "spring", "laravel", "html", "css", "tailwind",
    # Data / ML
    "machine learning", "deep learning", "nlp", "tensorflow", "pytorch",
    "scikit-learn", "pandas", "numpy", "matplotlib", "keras", "opencv",
    # Cloud / DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd",
    "jenkins", "github actions", "linux",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "dynamodb", "cassandra",
    # Other
    "git", "rest api", "graphql", "microservices", "agile", "scrum",
    "data structures", "algorithms", "sql", "excel", "power bi", "tableau",
]

def extract_skills(text: str) -> list[str]:
    """Return skills found in text using regex pattern matching."""
    text_lower = text.lower()
    found = []
    for skill in SKILL_PATTERNS:
        if re.search(r"\b" + skill + r"\b", text_lower):
            # Normalise display name
            found.append(skill.replace("\\+\\+", "++").replace("\\.", "."))
    return list(dict.fromkeys(found))

def extract_keywords(text: str, top_n: int = 20) -> list[str]:
    """TF-IDF top keywords from a single document."""
    cleaned = clean_text(text)
    if not cleaned:
        return []
    try:
        vec = TfidfVectorizer(max_features=top_n, stop_words="english", ngram_range=(1, 2))
        vec.fit([cleaned])
        return list(vec.get_feature_names_out())
    except Exception:
        return []

# ── Scoring ───────────────────────────────────────────────────────────────────

def _cosine_sim(text_a: str, text_b: str) -> float:
    """Cosine similarity between two text strings via TF-IDF."""
    if not text_a.strip() or not text_b.strip():
        return 0.0
    try:
        vec = TfidfVectorizer(stop_words="english")
        tfidf = vec.fit_transform([clean_text(text_a), clean_text(text_b)])
        return float(cosine_similarity(tfidf[0], tfidf[1])[0][0])
    except Exception:
        return 0.0

def _experience_years(text: str) -> float:
    """Rough estimate of total years of experience from text."""
    matches = re.findall(r"(\d+)\s*\+?\s*years?", text.lower())
    if matches:
        return min(float(max(int(m) for m in matches)), 20.0)
    # Count distinct year mentions as a proxy
    years = set(re.findall(r"\b(20\d{2}|19\d{2})\b", text))
    return min(len(years) * 0.5, 10.0)

def score_candidate(resume_text: str, jd_text: str,
                    resume_skills: list[str], jd_skills: list[str]) -> dict:
    """
    Returns a scoring dict with:
      match_score, matching_skills, missing_skills,
      skills_score, experience_score, education_score, keyword_score
    """
    # 1. Skills match (50%)
    resume_set = set(s.lower() for s in resume_skills)
    jd_set = set(s.lower() for s in jd_skills)
    matching = list(resume_set & jd_set)
    missing = list(jd_set - resume_set)
    skills_score = (len(matching) / len(jd_set) * 100) if jd_set else 0.0

    # 2. Experience relevance (25%) — cosine sim on experience sections
    exp_sim = _cosine_sim(resume_text, jd_text) * 100
    # Boost if candidate has many years
    years = _experience_years(resume_text)
    experience_score = min((exp_sim * 0.7 + years * 3), 100.0)

    # 3. Education match (15%) — keyword overlap
    edu_keywords = ["bachelor", "master", "phd", "mba", "b.tech", "m.tech",
                    "degree", "university", "college"]
    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()
    edu_hits = sum(1 for k in edu_keywords if k in jd_lower and k in resume_lower)
    education_score = min(edu_hits / max(
        sum(1 for k in edu_keywords if k in jd_lower), 1) * 100, 100.0)

    # 4. Keyword similarity (10%)
    keyword_score = _cosine_sim(resume_text, jd_text) * 100

    # Weighted total
    total = (
        skills_score * 0.50 +
        experience_score * 0.25 +
        education_score * 0.15 +
        keyword_score * 0.10
    )

    return {
        "match_score": round(min(total, 100.0), 2),
        "matching_skills": matching,
        "missing_skills": missing,
        "skills_score": round(skills_score, 2),
        "experience_score": round(experience_score, 2),
        "education_score": round(education_score, 2),
        "keyword_score": round(keyword_score, 2),
    }
