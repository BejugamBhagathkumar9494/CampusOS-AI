import io
import re
import zipfile
import hashlib
from typing import Dict, Any, List, Optional, Tuple
import httpx

IGNORED_DIR_PATTERNS = [
    r'^\.git(?:/|$)',
    r'node_modules(?:/|$)',
    r'\.next(?:/|$)',
    r'\.nuxt(?:/|$)',
    r'dist(?:/|$)',
    r'build(?:/|$)',
    r'out(?:/|$)',
    r'target(?:/|$)',
    r'bin(?:/|$)',
    r'obj(?:/|$)',
    r'__pycache__(?:/|$)',
    r'\.pytest_cache(?:/|$)',
    r'\.venv(?:/|$)',
    r'venv(?:/|$)',
    r'env(?:/|$)',
    r'\.idea(?:/|$)',
    r'\.vscode(?:/|$)',
    r'coverage(?:/|$)',
    r'\.gradle(?:/|$)',
]

IGNORED_FILE_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp',
    '.mp4', '.mov', '.avi', '.mp3', '.wav', '.pdf', '.zip', '.tar', '.gz',
    '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.pyc', '.wasm',
    '.ttf', '.woff', '.woff2', '.eot', '.map', '.min.js', '.min.css'
}

PRIORITY_MANIFEST_NAMES = {
    'readme.md', 'readme', 'package.json', 'requirements.txt', 'pyproject.toml',
    'setup.py', 'pom.xml', 'build.gradle', 'dockerfile', 'docker-compose.yml',
    'docker-compose.yaml', '.env.example', 'schema.prisma', 'go.mod', 'cargo.toml'
}


def parse_github_url(url: str) -> Tuple[str, str]:
    """
    Parses and validates a GitHub repository URL or shorthand (e.g. 'owner/repo').
    Returns (owner, repo_name).
    Raises ValueError on invalid formats.
    """
    cleaned = url.strip()
    if not cleaned:
        raise ValueError("GitHub repository URL cannot be empty.")

    # Remove query params & hashes (e.g. ?tab=readme)
    cleaned = cleaned.split('?')[0].split('#')[0].rstrip('/')

    # Handle SSH git@github.com:owner/repo.git
    if cleaned.startswith('git@github.com:'):
        cleaned = 'https://github.com/' + cleaned[len('git@github.com:'):]

    # Handle standard URLs or paths:
    # https://github.com/owner/repo/...
    # github.com/owner/repo/...
    match = re.search(r'github\.com/([a-zA-Z0-9_\-\.]+)/([a-zA-Z0-9_\-\.]+)', cleaned, re.IGNORECASE)
    if match:
        owner = match.group(1).strip()
        repo = match.group(2).strip()
        if repo.endswith('.git'):
            repo = repo[:-4]
        return owner, repo

    # Handle shorthand format: "owner/repo"
    shorthand = re.match(r'^([a-zA-Z0-9_\-\.]+)/([a-zA-Z0-9_\-\.]+)$', cleaned)
    if shorthand:
        owner = shorthand.group(1).strip()
        repo = shorthand.group(2).strip()
        if repo.endswith('.git'):
            repo = repo[:-4]
        return owner, repo

    raise ValueError("Invalid GitHub URL. Must be in the format 'https://github.com/owner/repository' or 'owner/repository'.")


def is_ignored_file(file_path: str) -> bool:
    """Checks if a file path belongs to ignored build/cache/binary directories."""
    path_lower = file_path.replace('\\', '/').lower()
    
    # Check directory patterns
    for pat in IGNORED_DIR_PATTERNS:
        if re.search(pat, path_lower):
            return True

    # Check extension
    for ext in IGNORED_FILE_EXTENSIONS:
        if path_lower.endswith(ext):
            return True

    # Ignore lock files unless essential
    if path_lower.endswith(('package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'poetry.lock')):
        return True

    return False


def get_file_priority(file_path: str) -> int:
    """Assigns priority score to files for intelligent scanning (lower = higher priority)."""
    p_low = file_path.replace('\\', '/').lower()
    base_name = p_low.split('/')[-1]

    if base_name in PRIORITY_MANIFEST_NAMES:
        return 0
    if any(k in p_low for k in ['route', 'controller', 'api', 'server', 'main', 'app', 'index']):
        return 1
    if any(k in p_low for k in ['model', 'schema', 'entity', 'database', 'db', 'migration']):
        return 2
    if any(k in p_low for k in ['service', 'hook', 'middleware', 'auth', 'security', 'context']):
        return 3
    if any(k in p_low for k in ['component', 'page', 'view', 'layout']):
        return 4
    if any(k in p_low for k in ['util', 'helper', 'lib', 'type', 'interface']):
        return 5
    return 6


async def fetch_github_metadata(owner: str, repo: str) -> Dict[str, Any]:
    """Fetches public GitHub repository metadata via GitHub REST API with graceful fallback."""
    headers = {"User-Agent": "CampusOS-RepoDNA-Scanner/1.0", "Accept": "application/vnd.github.v3+json"}
    url = f"https://api.github.com/repos/{owner}/{repo}"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return {
                    "owner": data.get("owner", {}).get("login", owner),
                    "repo_name": data.get("name", repo),
                    "default_branch": data.get("default_branch", "main"),
                    "description": data.get("description") or "No description provided.",
                    "stars_count": data.get("stargazers_count", 0),
                    "forks_count": data.get("forks_count", 0),
                    "primary_language": data.get("language") or "Unknown",
                    "is_private": data.get("private", False)
                }
            elif res.status_code == 404:
                raise ValueError(f"GitHub repository '{owner}/{repo}' not found. Please verify it is public and the URL is spelled correctly.")
            elif res.status_code == 403:
                # Rate limited -> fallback to defaults
                print(f"[GitHub Scanner] Rate limited on metadata for {owner}/{repo}, using defaults.")
        except httpx.RequestError as e:
            print(f"[GitHub Scanner] Network warning on metadata: {e}")

    # Fallback default metadata
    return {
        "owner": owner,
        "repo_name": repo,
        "default_branch": "main",
        "description": "Public GitHub Repository",
        "stars_count": 0,
        "forks_count": 0,
        "primary_language": "Unknown",
        "is_private": False
    }


async def fetch_github_repository(
    owner: str,
    repo: str,
    max_files: int = 60,
    max_file_size_bytes: int = 350000
) -> Dict[str, Any]:
    """
    Downloads and scans a public GitHub repository.
    Uses GitHub archive/zipball stream to fetch all files in a single fast HTTP request.
    Filters out dependencies and binary assets.
    """
    meta = await fetch_github_metadata(owner, repo)
    if meta.get("is_private"):
        raise ValueError("RepoDNA cannot access private repositories. Please provide a public repository URL.")

    branches_to_try = [meta.get("default_branch", "main"), "main", "master"]
    # De-duplicate while preserving order
    branches_to_try = list(dict.fromkeys([b for b in branches_to_try if b]))

    zip_bytes = None
    successful_branch = "main"

    headers = {"User-Agent": "CampusOS-RepoDNA-Scanner/1.0"}
    async with httpx.AsyncClient(follow_redirects=True, timeout=25.0) as client:
        for branch in branches_to_try:
            zip_url = f"https://codeload.github.com/{owner}/{repo}/zip/refs/heads/{branch}"
            try:
                res = await client.get(zip_url, headers=headers)
                if res.status_code == 200 and len(res.content) > 100:
                    zip_bytes = res.content
                    successful_branch = branch
                    break
            except Exception as branch_err:
                print(f"[GitHub Scanner] Branch {branch} attempt warning: {branch_err}")

    if not zip_bytes:
        raise ValueError(f"Unable to download repository content for '{owner}/{repo}'. Ensure the repository is public and has a 'main' or 'master' branch.")

    # Extract files in-memory
    extracted_files: List[Dict[str, Any]] = []
    tree_structure: List[str] = []

    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            namelist = zf.namelist()
            if not namelist:
                raise ValueError(f"Repository '{owner}/{repo}' appears to be empty.")

            # Root folder in zip is usually 'repo-name-branch/'
            root_prefix = namelist[0].split('/')[0] + '/'

            for raw_name in namelist:
                if raw_name.endswith('/'):
                    continue

                rel_path = raw_name
                if rel_path.startswith(root_prefix):
                    rel_path = rel_path[len(root_prefix):]

                if not rel_path:
                    continue

                # Add to tree structure
                if not is_ignored_file(rel_path):
                    tree_structure.append(rel_path)

                # Skip ignored files
                if is_ignored_file(rel_path):
                    continue

                info = zf.getinfo(raw_name)
                if info.file_size > max_file_size_bytes or info.file_size == 0:
                    continue

                try:
                    file_content_bytes = zf.read(raw_name)
                    # Check if binary
                    if b'\x00' in file_content_bytes[:512]:
                        continue

                    text_content = file_content_bytes.decode('utf-8', errors='ignore')
                    if not text_content.strip():
                        continue

                    content_hash = hashlib.sha256(text_content.encode('utf-8')).hexdigest()
                    priority = get_file_priority(rel_path)

                    extracted_files.append({
                        "file_path": rel_path,
                        "file_size_bytes": len(file_content_bytes),
                        "content": text_content,
                        "content_hash": content_hash,
                        "priority": priority
                    })
                except Exception as file_read_err:
                    print(f"[GitHub Scanner] File read error on {rel_path}: {file_read_err}")
    except zipfile.BadZipFile:
        raise ValueError("Received invalid repository archive from GitHub. Please try again.")

    if not extracted_files:
        raise ValueError(f"No analyzable source code files found in repository '{owner}/{repo}'.")

    # Sort files by architectural priority
    extracted_files.sort(key=lambda x: (x["priority"], len(x["file_path"].split('/'))))

    # Prioritize top N most relevant files
    prioritized_files = extracted_files[:max_files]

    return {
        "owner": owner,
        "repo_name": repo,
        "default_branch": successful_branch,
        "description": meta.get("description", ""),
        "stars_count": meta.get("stars_count", 0),
        "forks_count": meta.get("forks_count", 0),
        "primary_language": meta.get("primary_language", "Unknown"),
        "total_files_count": len(extracted_files),
        "tree_structure": tree_structure,
        "files": prioritized_files
    }


def filter_relevant_files(files: List[Dict[str, Any]], limit: int = 50) -> List[Dict[str, Any]]:
    """Filters and returns the top priority source files for deep AST and LLM analysis."""
    sorted_files = sorted(files, key=lambda x: (get_file_priority(x.get("file_path", "")), x.get("file_size_bytes", 0)))
    return sorted_files[:limit]
