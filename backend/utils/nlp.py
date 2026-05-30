"""
ML-based scoring pipeline.
  - Sentence-transformers (all-MiniLM-L6-v2) for semantic similarity
  - spaCy for NER-assisted skill/keyword extraction
  - Weighted scoring: Skills 40% | Semantic Similarity 35% | Experience 15% | Education 10%
"""
import re
from functools import lru_cache
from utils.parser import clean_text

# ── Lazy model loading ────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_sentence_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("all-MiniLM-L6-v2")

@lru_cache(maxsize=1)
def _get_spacy():
    import spacy
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        from spacy.cli import download
        download("en_core_web_sm")
        return spacy.load("en_core_web_sm")

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
    "transformers", "bert", "gpt", "llm", "hugging face",
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
    text_lower = text.lower()
    found = []
    for skill in SKILL_PATTERNS:
        if re.search(r"\b" + skill + r"\b", text_lower):
            found.append(skill.replace("\\+\\+", "++").replace("\\.", "."))
    return list(dict.fromkeys(found))

def extract_keywords(text: str, top_n: int = 20) -> list[str]:
    """spaCy noun-chunk keywords, fallback to TF-IDF."""
    cleaned = clean_text(text)
    if not cleaned:
        return []
    try:
        nlp = _get_spacy()
        doc = nlp(text[:10000])  # cap for speed
        chunks = [
            chunk.text.lower().strip()
            for chunk in doc.noun_chunks
            if len(chunk.text.strip()) > 2
        ]
        # deduplicate and return top_n
        seen, result = set(), []
        for c in chunks:
            if c not in seen:
                seen.add(c)
                result.append(c)
            if len(result) >= top_n:
                break
        return result
    except Exception:
        # fallback TF-IDF
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            vec = TfidfVectorizer(max_features=top_n, stop_words="english", ngram_range=(1, 2))
            vec.fit([cleaned])
            return list(vec.get_feature_names_out())
        except Exception:
            return []

# ── Semantic similarity via sentence-transformers ─────────────────────────────

def _semantic_similarity(text_a: str, text_b: str) -> float:
    """Cosine similarity between two texts using sentence embeddings."""
    if not text_a.strip() or not text_b.strip():
        return 0.0
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np
        model = _get_sentence_model()
        # Truncate to ~512 tokens worth of chars for speed
        emb = model.encode([text_a[:3000], text_b[:3000]], convert_to_numpy=True)
        sim = cosine_similarity([emb[0]], [emb[1]])[0][0]
        return float(np.clip(sim, 0.0, 1.0))
    except Exception:
        return _tfidf_similarity(text_a, text_b)

def _tfidf_similarity(text_a: str, text_b: str) -> float:
    """Fallback TF-IDF cosine similarity."""
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        vec = TfidfVectorizer(stop_words="english")
        tfidf = vec.fit_transform([clean_text(text_a), clean_text(text_b)])
        return float(cosine_similarity(tfidf[0], tfidf[1])[0][0])
    except Exception:
        return 0.0

# ── Experience heuristic ──────────────────────────────────────────────────────

def _experience_years(text: str) -> float:
    matches = re.findall(r"(\d+)\s*\+?\s*years?", text.lower())
    if matches:
        return min(float(max(int(m) for m in matches)), 20.0)
    years = set(re.findall(r"\b(20\d{2}|19\d{2})\b", text))
    return min(len(years) * 0.5, 10.0)

# ── Main scoring function ─────────────────────────────────────────────────────

def score_candidate(
    resume_text: str,
    jd_text: str,
    resume_skills: list[str],
    jd_skills: list[str],
) -> dict:
    """
    ML-powered scoring:
      - Skills match        40%  (exact skill overlap)
      - Semantic similarity 35%  (sentence-transformers cosine sim)
      - Experience          15%  (years + semantic relevance)
      - Education           10%  (keyword overlap)
    """
    # 1. Skills match (40%)
    resume_set = set(s.lower() for s in resume_skills)
    jd_set = set(s.lower() for s in jd_skills)
    matching = list(resume_set & jd_set)
    missing = list(jd_set - resume_set)
    skills_score = (len(matching) / len(jd_set) * 100) if jd_set else 0.0

    # 2. Semantic similarity (35%) — ML model
    sem_sim = _semantic_similarity(resume_text, jd_text)
    semantic_score = sem_sim * 100

    # 3. Experience (15%)
    years = _experience_years(resume_text)
    exp_sim = _tfidf_similarity(resume_text, jd_text) * 100
    experience_score = min(exp_sim * 0.6 + years * 4, 100.0)

    # 4. Education (10%)
    edu_keywords = [
        "bachelor", "master", "phd", "mba", "b.tech", "m.tech",
        "degree", "university", "college",
    ]
    jd_lower, resume_lower = jd_text.lower(), resume_text.lower()
    jd_edu = [k for k in edu_keywords if k in jd_lower]
    edu_hits = sum(1 for k in jd_edu if k in resume_lower)
    education_score = (edu_hits / len(jd_edu) * 100) if jd_edu else 50.0

    # Weighted total
    total = (
        skills_score    * 0.40 +
        semantic_score  * 0.35 +
        experience_score * 0.15 +
        education_score * 0.10
    )

    return {
        "match_score":      round(min(total, 100.0), 2),
        "matching_skills":  matching,
        "missing_skills":   missing,
        "skills_score":     round(skills_score, 2),
        "semantic_score":   round(semantic_score, 2),
        "experience_score": round(experience_score, 2),
        "education_score":  round(education_score, 2),
        # keep keyword_score alias for frontend compatibility
        "keyword_score":    round(semantic_score, 2),
    }
