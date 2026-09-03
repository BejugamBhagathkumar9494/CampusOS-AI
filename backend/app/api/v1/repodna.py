import json
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.database_models import User, StudyRepository, RepositoryFile, RepositoryAnalysis
from app.services.repodna.github_scanner import parse_github_url, fetch_github_repository, filter_relevant_files
from app.services.repodna.code_extractor import extract_code_metadata
from app.services.repodna.tech_detector import detect_technologies_from_files
from app.services.repodna.repodna_indexer import index_repository_files
from app.services.repodna.repodna_generator import analyze_repository_pipeline
from app.services.repodna.repodna_chat import answer_repository_query

router = APIRouter()


class RepoAnalyzeRequest(BaseModel):
    github_url: str


class RepoQueryRequest(BaseModel):
    repository_id: str
    question: str


@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_github_repository(
    payload: RepoAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validates, scans, indexes, and generates a RepoDNA intelligence report for a public GitHub repository.
    """
    url = payload.github_url.strip()
    try:
        owner, repo_name = parse_github_url(url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check if this student already analyzed this repo recently
    normalized_url = f"https://github.com/{owner}/{repo_name}".lower()
    existing_repo = db.query(StudyRepository).filter(
        StudyRepository.user_id == current_user.id,
        StudyRepository.github_url.ilike(f"%github.com/{owner}/{repo_name}%")
    ).first()

    if existing_repo and existing_repo.status == "analyzed" and existing_repo.analysis:
        return {
            "message": "Repository intelligence retrieved from cache.",
            "repository": {
                "id": existing_repo.id,
                "owner": existing_repo.owner,
                "repo_name": existing_repo.repo_name,
                "github_url": existing_repo.github_url,
                "default_branch": existing_repo.default_branch,
                "description": existing_repo.description,
                "stars_count": existing_repo.stars_count,
                "forks_count": existing_repo.forks_count,
                "primary_language": existing_repo.primary_language,
                "file_count": existing_repo.file_count,
                "status": existing_repo.status,
                "created_at": existing_repo.created_at
            },
            "analysis": format_analysis_output(existing_repo.analysis)
        }

    # Fetch and scan repository
    try:
        repo_data = await fetch_github_repository(owner, repo_name, max_files=60)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as scan_err:
        raise HTTPException(
            status_code=500,
            detail=f"RepoDNA couldn't access this repository: {str(scan_err)}. Make sure it is public and the URL is correct."
        )

    # Create or update StudyRepository record
    if not existing_repo:
        repo_id = str(uuid.uuid4())
        study_repo = StudyRepository(
            id=repo_id,
            user_id=current_user.id,
            github_url=f"https://github.com/{owner}/{repo_name}",
            owner=owner,
            repo_name=repo_name,
            default_branch=repo_data.get("default_branch", "main"),
            description=repo_data.get("description", ""),
            stars_count=repo_data.get("stars_count", 0),
            forks_count=repo_data.get("forks_count", 0),
            primary_language=repo_data.get("primary_language", "Unknown"),
            status="scanning"
        )
        db.add(study_repo)
        db.commit()
        db.refresh(study_repo)
    else:
        study_repo = existing_repo
        study_repo.status = "scanning"
        study_repo.description = repo_data.get("description", study_repo.description)
        study_repo.stars_count = repo_data.get("stars_count", study_repo.stars_count)
        study_repo.forks_count = repo_data.get("forks_count", study_repo.forks_count)
        study_repo.primary_language = repo_data.get("primary_language", study_repo.primary_language)
        db.commit()

    raw_files = repo_data.get("files", [])
    tree_structure = repo_data.get("tree_structure", [])

    # Extract metadata for files
    file_metadata_map = {}
    for f in raw_files:
        meta = extract_code_metadata(f["file_path"], f["content"])
        file_metadata_map[f["file_path"]] = meta

    # Detect Technologies
    detected_tech = detect_technologies_from_files(raw_files)

    # Index into vector chunks
    index_repository_files(db, study_repo, raw_files, file_metadata_map)

    # Generate RepoDNA Report
    analysis_record = analyze_repository_pipeline(
        db=db,
        repository=study_repo,
        files=raw_files,
        file_metadata_map=file_metadata_map,
        detected_tech=detected_tech,
        tree_structure=tree_structure
    )

    return {
        "message": "Repository analyzed successfully.",
        "repository": {
            "id": study_repo.id,
            "owner": study_repo.owner,
            "repo_name": study_repo.repo_name,
            "github_url": study_repo.github_url,
            "default_branch": study_repo.default_branch,
            "description": study_repo.description,
            "stars_count": study_repo.stars_count,
            "forks_count": study_repo.forks_count,
            "primary_language": study_repo.primary_language,
            "file_count": study_repo.file_count,
            "status": study_repo.status,
            "created_at": study_repo.created_at
        },
        "analysis": format_analysis_output(analysis_record)
    }


@router.get("/repositories", status_code=status.HTTP_200_OK)
def get_user_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all repositories analyzed by the authenticated student."""
    repos = db.query(StudyRepository).filter(
        StudyRepository.user_id == current_user.id
    ).order_by(StudyRepository.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "owner": r.owner,
            "repo_name": r.repo_name,
            "github_url": r.github_url,
            "default_branch": r.default_branch,
            "description": r.description,
            "stars_count": r.stars_count,
            "forks_count": r.forks_count,
            "primary_language": r.primary_language,
            "file_count": r.file_count,
            "status": r.status,
            "created_at": r.created_at
        }
        for r in repos
    ]


@router.get("/repositories/{repository_id}", status_code=status.HTTP_200_OK)
def get_repository_details(
    repository_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches details and full RepoDNA analysis report for a specific repository."""
    repo = db.query(StudyRepository).filter(
        StudyRepository.id == repository_id,
        StudyRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository analysis not found or unauthorized.")

    analysis = format_analysis_output(repo.analysis) if repo.analysis else None

    return {
        "repository": {
            "id": repo.id,
            "owner": repo.owner,
            "repo_name": repo.repo_name,
            "github_url": repo.github_url,
            "default_branch": repo.default_branch,
            "description": repo.description,
            "stars_count": repo.stars_count,
            "forks_count": repo.forks_count,
            "primary_language": repo.primary_language,
            "file_count": repo.file_count,
            "status": repo.status,
            "created_at": repo.created_at
        },
        "analysis": analysis
    }


@router.delete("/repositories/{repository_id}", status_code=status.HTTP_200_OK)
def delete_repository(
    repository_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes repository and all associated files/chunks."""
    repo = db.query(StudyRepository).filter(
        StudyRepository.id == repository_id,
        StudyRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")

    db.delete(repo)
    db.commit()
    return {"message": "Repository deleted successfully."}


@router.get("/repositories/{repository_id}/files", status_code=status.HTTP_200_OK)
def get_repository_files(
    repository_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists analyzed source files with purpose summaries for a repository."""
    repo = db.query(StudyRepository).filter(
        StudyRepository.id == repository_id,
        StudyRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")

    files = db.query(RepositoryFile).filter(
        RepositoryFile.repository_id == repository_id
    ).order_by(RepositoryFile.file_path.asc()).all()

    return [
        {
            "id": f.id,
            "file_path": f.file_path,
            "file_type": f.file_type,
            "language": f.language,
            "file_size_bytes": f.file_size_bytes,
            "purpose_summary": f.purpose_summary,
            "excerpt": f.content_excerpt,
            "imports": json.loads(f.imports_json or "[]"),
            "exports": json.loads(f.exports_json or "[]")
        }
        for f in files
    ]


@router.post("/query", status_code=status.HTTP_200_OK)
def query_repository(
    payload: RepoQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Interactive codebase Q&A grounded in the repository files."""
    repo = db.query(StudyRepository).filter(
        StudyRepository.id == payload.repository_id,
        StudyRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or unauthorized.")

    result = answer_repository_query(db, repo, payload.question)
    return result


def format_analysis_output(analysis: Optional[RepositoryAnalysis]) -> Optional[Dict[str, Any]]:
    """Helper to deserialize JSON fields for API response."""
    if not analysis:
        return None

    def safe_json(val: Optional[str], default: Any) -> Any:
        if not val:
            return default
        try:
            return json.loads(val)
        except Exception:
            return default

    return {
        "one_line_desc": analysis.one_line_desc,
        "short_summary": analysis.short_summary,
        "detailed_overview": analysis.detailed_overview,
        "beginner_explanation": analysis.beginner_explanation,
        "interview_pitch": analysis.interview_pitch,
        "architecture": safe_json(analysis.architecture_json, {}),
        "tech_stack": safe_json(analysis.tech_stack_json, {}),
        "project_structure": safe_json(analysis.project_structure_json, []),
        "application_flows": safe_json(analysis.application_flows_json, []),
        "database_analysis": safe_json(analysis.database_analysis_json, {}),
        "api_analysis": safe_json(analysis.api_analysis_json, []),
        "authentication_analysis": safe_json(analysis.authentication_analysis_json, {}),
        "project_health": safe_json(analysis.project_health_json, {}),
        "improvements": safe_json(analysis.improvements_json, []),
        "interview_questions": safe_json(analysis.interview_questions_json, [])
    }
