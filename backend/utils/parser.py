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
            t = page.extract_text()
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

def extract_name(text: str) -> str:
    """Heuristic: first non-empty line that looks like a name."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    for line in lines[:5]:
        # A name line: 2-4 words, no digits, not too long
        words = line.split()
        if 2 <= len(words) <= 4 and not any(c.isdigit() for c in line) and len(line) < 50:
            return line.title()
    return lines[0].title() if lines else "Unknown"

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
