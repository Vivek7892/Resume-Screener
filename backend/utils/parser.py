import re
import pdfplumber
import docx
from pathlib import Path

def extract_text(file_path: str) -> str:
    """Extract raw text from PDF, DOC, or DOCX files."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return _extract_docx(file_path)
    return ""

def _extract_pdf(path: str) -> str:
    text = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            t = None
            # layout=True preserves line breaks better but can fail on some PDFs
            try:
                t = page.extract_text(layout=True)
            except Exception:
                pass
            if not t:
                try:
                    t = page.extract_text()
                except Exception:
                    pass
            if t:
                text.append(t)
    return "\n".join(text)

def _extract_docx(path: str) -> str:
    doc = docx.Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def clean_text(text: str) -> str:
    """Lowercase, remove special chars, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\+\#\.]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

# ── Name extraction ───────────────────────────────────────────────────────────

_SECTION_HEADERS = {
    "summary", "objective", "profile", "experience", "education", "skills",
    "projects", "certifications", "awards", "references", "contact",
    "work experience", "professional experience", "technical skills",
    "personal information", "career objective", "about me", "overview",
    "employment", "qualifications", "achievements", "interests", "languages",
    "curriculum vitae", "resume", "cv", "declaration", "hobbies",
}

# Patterns that disqualify a token from being part of a name
_NOISE_RE = re.compile(
    r"(email|phone|mobile|tel|linkedin|github|gitlab|address|dob|date|www|http|"
    r"@|\d{4,}|[+()]{2,}|curriculum|vitae|portfolio|objective|summary|profile)",
    re.IGNORECASE,
)

# Separators PDFs use to join name + contact on one line
_SEPARATOR_RE = re.compile(r"[|•·\t]{1,}|\s{3,}")


def _candidate_lines(text: str) -> list[str]:
    """
    Split raw resume text into clean candidate lines.
    Also splits lines that PDFs merge with separators like | · or large spaces.
    """
    raw_lines = text.split("\n")
    result = []
    for raw in raw_lines[:30]:          # only look at top 30 lines
        # split on common PDF inline separators
        parts = _SEPARATOR_RE.split(raw)
        for p in parts:
            p = p.strip()
            if p:
                result.append(p)
    return result


def _is_name_token(word: str) -> bool:
    """A single word that could be part of a person's name."""
    # Allow: letters, hyphens, apostrophes, trailing dot (initials like "A.")
    return bool(re.match(r"^[A-Za-z][A-Za-z\-\']*\.?$", word))


def _is_likely_name(line: str) -> bool:
    """Return True if the line looks like a person's full name."""
    line = line.strip()
    if not line or len(line) > 55:
        return False
    if _NOISE_RE.search(line):
        return False
    if line.lower().rstrip(":") in _SECTION_HEADERS:
        return False
    words = line.split()
    if not (2 <= len(words) <= 5):
        return False
    # Every word must look like a name token
    if not all(_is_name_token(w) for w in words):
        return False
    # At least one word must be title-cased or ALL-CAPS (not all lowercase)
    if all(w.islower() for w in words):
        return False
    return True


def extract_name(text: str) -> str:
    """
    Multi-strategy name extraction:
      1. spaCy PERSON NER on pre-split top lines
      2. Heuristic scan of pre-split top lines
      3. Last-resort: first non-noise line
    """
    candidate_lines = _candidate_lines(text)

    # ── Strategy 1: spaCy NER ────────────────────────────────────────────────
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        # Feed each line individually so NER isn't confused by merged contact info
        for line in candidate_lines[:20]:
            if _NOISE_RE.search(line):
                continue
            doc = nlp(line)
            for ent in doc.ents:
                if ent.label_ == "PERSON" and _is_likely_name(ent.text):
                    return ent.text.title()
    except Exception:
        pass

    # ── Strategy 2: Heuristic scan ───────────────────────────────────────────
    for line in candidate_lines[:20]:
        if _is_likely_name(line):
            return line.title()

    # ── Strategy 3: Last resort — first non-noise, non-header line ───────────
    for line in candidate_lines[:10]:
        if not _NOISE_RE.search(line) and line.lower().rstrip(":") not in _SECTION_HEADERS:
            # strip any trailing digits/punctuation
            cleaned = re.sub(r"[^A-Za-z\s\-\']", "", line).strip()
            if cleaned:
                return cleaned.title()

    return "Unknown"

def extract_education(text: str) -> list[str]:
    """Extract education-related lines."""
    keywords = ["bachelor", "master", "phd", "b.sc", "m.sc", "b.tech", "m.tech",
                "mba", "degree", "university", "college", "institute", "diploma"]
    results = []
    for line in text.split("\n"):
        low = line.lower()
        if any(k in low for k in keywords) and len(line.strip()) > 5:
            results.append(line.strip())
    return list(dict.fromkeys(results))[:5]  # deduplicate, cap at 5

def extract_experience(text: str) -> list[str]:
    """Extract experience-related lines (years / job titles)."""
    year_pattern = re.compile(r"\b(19|20)\d{2}\b")
    exp_keywords = ["experience", "worked", "engineer", "developer", "analyst",
                    "manager", "intern", "lead", "architect", "consultant"]
    results = []
    for line in text.split("\n"):
        low = line.lower()
        if (year_pattern.search(line) or any(k in low for k in exp_keywords)) and len(line.strip()) > 5:
            results.append(line.strip())
    return list(dict.fromkeys(results))[:8]
