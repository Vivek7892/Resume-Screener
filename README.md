# ResumeRank AI — Resume Screening & Candidate Ranking Web Application

> **Task assigned by:** Chitralai  
> **Project type:** Full-Stack Web Application  
> **Purpose:** AI-powered HR tool to upload resumes, compare them against a Job Description, and rank candidates by suitability score.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [AI Scoring System](#ai-scoring-system)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Environment Variables](#environment-variables)
9. [Local Setup & Installation](#local-setup--installation)
10. [Running the Application](#running-the-application)
11. [Example API Responses](#example-api-responses)
12. [Deployment Instructions](#deployment-instructions)
13. [Folder Structure](#folder-structure)

---

## Project Overview

ResumeRank AI is a production-ready full-stack web application built for HR teams. It allows users to:

- Upload multiple resumes (PDF, DOC, DOCX)
- Provide a Job Description by pasting text or uploading a file
- Automatically parse and analyze each resume using NLP
- Score and rank candidates from highest to lowest suitability
- View results on a modern dashboard with card and table views
- Search, filter, and export results to CSV

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS            |
| Backend    | FastAPI (Python)                                |
| Database   | PostgreSQL + SQLAlchemy ORM                     |
| AI / NLP   | scikit-learn, spaCy, sentence-transformers      |
| File Parse | pdfplumber, python-docx                         |
| HTTP Client| Axios                                           |
| UI Icons   | lucide-react                                    |
| Upload UI  | react-dropzone                                  |
| Deployment | Vercel (frontend), Render (backend + database)  |

---

## Project Structure

```
taskby_chitralai/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Backend environment variables
│   ├── database/
│   │   └── db.py                # SQLAlchemy engine, session, Base
│   ├── models/
│   │   └── models.py            # ORM models: Candidate, JobDescription
│   ├── routes/
│   │   ├── upload.py            # POST /upload-resumes, POST /upload-jd
│   │   ├── analyze.py           # POST /analyze
│   │   └── results.py           # GET /results, GET /results/export
│   ├── utils/
│   │   ├── parser.py            # Text extraction, name/edu/exp parsing
│   │   └── nlp.py               # Skill extraction, scoring pipeline
│   ├── services/                # Reserved for future service modules
│   └── uploads/
│       ├── resumes/             # Uploaded resume files
│       └── jd/                  # Uploaded JD files
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Home page — upload & analyze
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Global styles
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Results dashboard
│   │   ├── components/
│   │   │   ├── DropZone.tsx     # Drag-and-drop file upload
│   │   │   ├── CandidateCard.tsx# Expandable candidate result card
│   │   │   ├── ResultsTable.tsx # Table view of all candidates
│   │   │   ├── ScoreBar.tsx     # Animated progress bar
│   │   │   ├── SkillBadges.tsx  # Colored skill tag badges
│   │   │   └── Spinner.tsx      # Loading spinner
│   │   ├── services/
│   │   │   └── api.ts           # Axios API calls
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   └── utils/
│   │       └── score.ts         # Score color/label helpers
│   ├── next.config.mjs          # Next.js config (API proxy for dev)
│   ├── tailwind.config.ts       # Tailwind configuration
│   ├── package.json
│   └── .env.local               # Frontend environment variables
│
└── render.yaml                  # Render deployment config
```

---

## Core Features

### 1. Resume Upload
- Drag-and-drop or click-to-browse upload interface
- Supports PDF, DOC, and DOCX formats
- Upload single or multiple resumes at once
- Files are stored in `backend/uploads/resumes/` with UUID filenames

### 2. Job Description Input
- Paste JD text directly into a textarea
- Or upload a JD document (PDF/DOC/DOCX)
- Toggle between paste and upload modes

### 3. Resume Parsing & Analysis
Each resume is parsed to extract:
- **Candidate Name** — spaCy NER + heuristic fallback
- **Skills** — regex pattern matching against a 60+ skill taxonomy
- **Education** — keyword-based line extraction
- **Experience** — year-pattern and job-title keyword extraction
- **Keywords** — spaCy noun chunks (fallback: TF-IDF)

### 4. Candidate Scoring & Ranking
- Each candidate receives a **Match Score (0–100)**
- Candidates are ranked from highest to lowest score
- Matching and missing skills are identified per candidate

### 5. Dashboard
- Stats bar: total candidates, top score, average score
- Card view with expandable score breakdown per candidate
- Table view for compact comparison
- Search by candidate name
- Export all results to CSV

---

## AI Scoring System

The scoring pipeline uses a weighted combination of four signals:

| Signal               | Weight | Method                                      |
|----------------------|--------|---------------------------------------------|
| Skills Match         | 40%    | Exact overlap between resume and JD skills  |
| Semantic Similarity  | 35%    | Sentence-transformers cosine similarity     |
| Experience Relevance | 15%    | TF-IDF similarity + years-of-experience     |
| Education Match      | 10%    | Education keyword overlap with JD           |

**Models used:**
- `all-MiniLM-L6-v2` (sentence-transformers) — semantic similarity
- `en_core_web_sm` (spaCy) — NER for name extraction and keyword chunking
- `TfidfVectorizer` (scikit-learn) — fallback similarity and keyword extraction

**Final Score Formula:**
```
match_score = (skills_score × 0.40)
            + (semantic_score × 0.35)
            + (experience_score × 0.15)
            + (education_score × 0.10)
```

---

## Database Schema

### Table: `job_descriptions`

| Column     | Type      | Description                  |
|------------|-----------|------------------------------|
| id         | Integer   | Primary key                  |
| title      | String    | Optional JD title            |
| content    | Text      | Full JD text                 |
| created_at | DateTime  | Auto timestamp               |

### Table: `candidates`

| Column           | Type    | Description                              |
|------------------|---------|------------------------------------------|
| id               | Integer | Primary key                              |
| session_id       | String  | Groups candidates from one analysis run  |
| name             | String  | Extracted candidate name                 |
| filename         | String  | Original uploaded filename               |
| file_path        | String  | Absolute path to stored file             |
| raw_text         | Text    | First 5000 chars of extracted text       |
| skills           | JSON    | List of detected skills                  |
| education        | JSON    | List of education lines                  |
| experience       | JSON    | List of experience lines                 |
| keywords         | JSON    | Top keywords from resume                 |
| match_score      | Float   | Final weighted score (0–100)             |
| matching_skills  | JSON    | Skills present in both resume and JD     |
| missing_skills   | JSON    | Skills in JD but not in resume           |
| skills_score     | Float   | Skills sub-score                         |
| semantic_score   | Float   | Semantic similarity sub-score            |
| experience_score | Float   | Experience sub-score                     |
| education_score  | Float   | Education sub-score                      |
| rank             | Integer | Rank among candidates in session         |
| created_at       | DateTime| Auto timestamp                           |

---

## API Reference

### `POST /upload-resumes`
Upload one or more resume files.

**Request:** `multipart/form-data` — field: `files`  
**Response:**
```json
{
  "message": "3 resume(s) uploaded",
  "files": [
    { "original_name": "john_doe.pdf", "saved_path": "C:/...uploads/resumes/abc123.pdf" }
  ]
}
```

---

### `POST /upload-jd`
Upload a JD document file.

**Request:** `multipart/form-data` — field: `file`  
**Response:**
```json
{
  "message": "JD uploaded",
  "saved_path": "C:/...uploads/jd/xyz789.pdf"
}
```

---

### `POST /analyze`
Run the full analysis pipeline on uploaded resumes against a JD.

**Request body:**
```json
{
  "jd_text": "We are looking for a Python developer with FastAPI...",
  "resume_paths": [
    "C:/...uploads/resumes/abc123.pdf",
    "C:/...uploads/resumes/def456.docx"
  ]
}
```

**Response:**
```json
{
  "session_id": "a1b2c3d4e5f6",
  "total": 2,
  "candidates": [
    {
      "id": 1,
      "name": "Jane Smith",
      "filename": "abc123.pdf",
      "match_score": 82.5,
      "rank": 1,
      "matching_skills": ["python", "fastapi", "postgresql"],
      "missing_skills": ["docker", "kubernetes"],
      "skills_score": 75.0,
      "semantic_score": 88.3,
      "experience_score": 79.1,
      "education_score": 100.0
    }
  ]
}
```

---

### `GET /results`
Fetch results, optionally filtered.

**Query params:**
- `session_id` — filter by analysis session
- `search` — filter by candidate name (case-insensitive)
- `sort_by` — column to sort by (default: `rank`)

---

### `GET /results/export`
Download results as a CSV file.

**Query params:** `session_id` (optional)  
**Response:** `text/csv` file download

---

### `GET /health`
Health check endpoint.

**Response:** `{ "status": "ok" }`

---

## Environment Variables

### Backend — `backend/.env`

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/resume_screener
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> In development, if `NEXT_PUBLIC_API_URL` is not set, the frontend uses Next.js API rewrites (`/api → localhost:8000`).

---

## Local Setup & Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Git

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/taskby_chitralai.git
cd taskby_chitralai
```

---

### Step 2 — PostgreSQL Database Setup

```sql
-- Run in psql or pgAdmin
CREATE DATABASE resume_screener;
```

Tables are created automatically on backend startup via SQLAlchemy.

---

### Step 3 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm
```

Create the `.env` file:

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/resume_screener
ALLOWED_ORIGINS=http://localhost:3000
```

---

### Step 4 — Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

Create the `.env.local` file:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running the Application

### Start the Backend

```bash
cd backend

# Activate virtual environment first
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`  
Interactive API docs: `http://localhost:8000/docs`

---

### Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

### Verify Everything is Running

| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:3000            |
| Backend   | http://localhost:8000            |
| API Docs  | http://localhost:8000/docs       |
| Health    | http://localhost:8000/health     |

---

## Example API Responses

### Successful Analysis Response

```json
{
  "session_id": "f3a9b2c1d4e5678901234567890abcde",
  "total": 3,
  "candidates": [
    {
      "id": 5,
      "session_id": "f3a9b2c1d4e5678901234567890abcde",
      "name": "Priya Sharma",
      "filename": "priya_resume.pdf",
      "skills": ["python", "fastapi", "postgresql", "docker", "aws"],
      "education": ["B.Tech Computer Science, IIT Delhi, 2021"],
      "experience": ["Software Engineer at TechCorp, 2021–2024"],
      "keywords": ["backend development", "rest api", "cloud deployment"],
      "match_score": 87.4,
      "matching_skills": ["python", "fastapi", "postgresql", "aws"],
      "missing_skills": ["kubernetes", "terraform"],
      "skills_score": 80.0,
      "semantic_score": 91.2,
      "experience_score": 83.5,
      "education_score": 100.0,
      "rank": 1,
      "created_at": "2025-01-15 10:32:45"
    }
  ],
  "warnings": null
}
```

### Validation Error Response

```json
{
  "detail": "No resumes could be processed. | File not found: uploads/resumes/missing.pdf"
}
```

---

## Deployment Instructions

### Deploy Backend on Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Set the following:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard:
   - `DATABASE_URL` — from Render PostgreSQL (auto-filled if using `render.yaml`)
   - `ALLOWED_ORIGINS` — your Vercel frontend URL

### Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` — your Render backend URL (e.g. `https://resumerank-backend.onrender.com`)
5. Deploy

### One-Click Render Deploy (render.yaml)

The `render.yaml` file at the project root configures both services and the PostgreSQL database for Render's Blueprint deployment:

```bash
# From Render dashboard → New → Blueprint
# Point to your repo — Render reads render.yaml automatically
```

---

## Notes

- The `sentence-transformers` model (`all-MiniLM-L6-v2`) is downloaded automatically on first run (~90 MB)
- The `en_core_web_sm` spaCy model must be downloaded manually: `python -m spacy download en_core_web_sm`
- Uploaded files are stored locally in `backend/uploads/`. For production, replace with S3 or similar cloud storage
- The `session_id` returned from `/analyze` is used to scope dashboard results to a single analysis run
- Image-based PDFs (scanned documents) are not supported — only text-layer PDFs are parsed

---

*Built as a task assigned by Chitralai — AI-powered Resume Screening & Candidate Ranking Web Application.*
