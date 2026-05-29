import os, uuid, shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

router = APIRouter()
UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}

def _save_file(file: UploadFile, subfolder: str) -> str:
    dest_dir = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(dest_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(dest_dir, unique_name)
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return dest_path

@router.post("/upload-resumes")
async def upload_resumes(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    saved = []
    for file in files:
        path = _save_file(file, "resumes")
        saved.append({"original_name": file.filename, "saved_path": path})
    return {"message": f"{len(saved)} resume(s) uploaded", "files": saved}

@router.post("/upload-jd")
async def upload_jd(file: UploadFile = File(...)):
    path = _save_file(file, "jd")
    return {"message": "JD uploaded", "saved_path": path}
