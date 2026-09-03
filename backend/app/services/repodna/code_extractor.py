import re
from typing import Dict, Any, List, Optional


def classify_file_type(file_path: str) -> str:
    """Classifies source file by architectural role."""
    p = file_path.lower()
    if p.endswith(('package.json', 'requirements.txt', 'pyproject.toml', 'pom.xml', 'build.gradle', 'dockerfile', 'docker-compose.yml')):
        return 'manifest'
    if p.endswith(('readme.md', 'readme', 'license', 'contributing.md')):
        return 'documentation'
    if any(k in p for k in ['controller', 'handler']):
        return 'controller'
    if any(k in p for k in ['route', 'router', 'api/', 'endpoint']):
        return 'route'
    if any(k in p for k in ['model', 'schema', 'entity', 'migration', 'prisma']):
        return 'model'
    if any(k in p for k in ['component', 'ui/', 'view', 'page', 'screen', 'layout']):
        return 'component'
    if any(k in p for k in ['service', 'manager', 'repository']):
        return 'service'
    if any(k in p for k in ['middleware', 'guard', 'interceptor', 'auth']):
        return 'middleware'
    if any(k in p for k in ['hook', 'state', 'store', 'context', 'reducer']):
        return 'state'
    if any(k in p for k in ['config', 'setting', 'constant', 'env']):
        return 'config'
    if any(k in p for k in ['test', 'spec', '__test__']):
        return 'test'
    if any(k in p for k in ['util', 'helper', 'lib']):
        return 'utility'
    return 'source'


def detect_language(file_path: str) -> str:
    """Detects programming language from file extension."""
    ext = file_path.lower().split('.')[-1] if '.' in file_path else ''
    mapping = {
        'js': 'JavaScript',
        'jsx': 'JavaScript (React)',
        'ts': 'TypeScript',
        'tsx': 'TypeScript (React)',
        'py': 'Python',
        'java': 'Java',
        'go': 'Go',
        'rs': 'Rust',
        'php': 'PHP',
        'rb': 'Ruby',
        'cs': 'C#',
        'cpp': 'C++',
        'c': 'C',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'json': 'JSON',
        'yaml': 'YAML',
        'yml': 'YAML',
        'sql': 'SQL',
        'sh': 'Shell',
        'md': 'Markdown'
    }
    return mapping.get(ext, 'Plain Text')


def extract_imports(content: str, language: str) -> List[str]:
    """Extracts imported modules or libraries from code."""
    imports = []
    lines = content.split('\n')
    for line in lines[:80]:  # Inspect first 80 lines
        line_clean = line.strip()
        # JavaScript/TypeScript ES6
        match_es6 = re.match(r'import\s+(?:.*?\s+from\s+)?[\'"]([^\'"]+)[\'"]', line_clean)
        if match_es6:
            imports.append(match_es6.group(1))
            continue
        # JavaScript CommonJS
        match_cjs = re.search(r'require\([\'"]([^\'"]+)[\'"]\)', line_clean)
        if match_cjs:
            imports.append(match_cjs.group(1))
            continue
        # Python imports
        match_py = re.match(r'(?:from\s+([a-zA-Z0-9_\.]+)\s+import|import\s+([a-zA-Z0-9_\.]+))', line_clean)
        if match_py:
            pkg = match_py.group(1) or match_py.group(2)
            if pkg:
                imports.append(pkg)
            continue
    return list(dict.fromkeys(imports))[:12]


def extract_exports_and_symbols(content: str) -> Dict[str, List[str]]:
    """Extracts defined functions, classes, and components."""
    functions = []
    classes = []

    # JS/TS Functions: function foo(), const bar = () => {}, async function baz()
    js_funcs = re.findall(r'(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)', content)
    js_arrow = re.findall(r'(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>', content)
    functions.extend(js_funcs)
    functions.extend(js_arrow)

    # Python Functions: def foo():
    py_funcs = re.findall(r'def\s+([a-zA-Z0-9_]+)\s*\(', content)
    functions.extend(py_funcs)

    # Classes: class Foo
    class_matches = re.findall(r'class\s+([a-zA-Z0-9_$]+)', content)
    classes.extend(class_matches)

    return {
        "functions": list(dict.fromkeys(functions))[:10],
        "classes": list(dict.fromkeys(classes))[:6]
    }


def extract_api_endpoints(content: str, file_path: str) -> List[Dict[str, str]]:
    """Detects REST API route definitions."""
    endpoints = []

    # Express / Fastify: router.get('/path', handler), app.post('/login', ...)
    express_routes = re.findall(r'(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]', content, re.IGNORECASE)
    for method, path in express_routes:
        endpoints.append({
            "method": method.upper(),
            "endpoint": path,
            "source_file": file_path
        })

    # FastAPI / Flask: @app.get("/items"), @router.post("/auth/login")
    py_routes = re.findall(r'@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]', content, re.IGNORECASE)
    for method, path in py_routes:
        endpoints.append({
            "method": method.upper(),
            "endpoint": path,
            "source_file": file_path
        })

    # Frontend API calls: axios.post('/api/login'), fetch('/api/users')
    fe_calls = re.findall(r'(?:axios|fetch)\s*(?:\.(get|post|put|delete|patch))?\s*\(\s*[\'"`]([^\'"`]+)[\'"`]', content, re.IGNORECASE)
    for method_opt, path in fe_calls:
        if path.startswith('/') or 'http' in path or 'api' in path:
            endpoints.append({
                "method": (method_opt or "FETCH").upper(),
                "endpoint": path,
                "source_file": file_path
            })

    return endpoints[:8]


def extract_database_models(content: str, file_path: str) -> List[str]:
    """Detects database models and ORM entities."""
    models = []
    # Mongoose: mongoose.model('User', ...)
    mongoose_models = re.findall(r'mongoose\.model\s*\(\s*[\'"]([a-zA-Z0-9_]+)[\'"]', content)
    models.extend(mongoose_models)

    # Prisma: model User { ... }
    prisma_models = re.findall(r'model\s+([a-zA-Z0-9_]+)\s*\{', content)
    models.extend(prisma_models)

    # SQLAlchemy: class User(Base):
    sqlalchemy_models = re.findall(r'class\s+([a-zA-Z0-9_]+)\s*\((?:Base|db\.Model|models\.Model)\):', content)
    models.extend(sqlalchemy_models)

    return list(dict.fromkeys(models))


def generate_file_purpose_summary(file_path: str, file_type: str, functions: List[str], classes: List[str], imports: List[str]) -> str:
    """Generates a concise factual description of what the file does."""
    base_name = file_path.split('/')[-1]
    
    if file_type == 'manifest':
        return f"Project manifest/configuration defining dependencies and build commands for {base_name}."
    if file_type == 'documentation':
        return f"Project documentation providing setup instructions, architecture notes, and features."
    if file_type == 'route':
        return f"API routing module defining HTTP endpoints and request handlers."
    if file_type == 'controller':
        return f"Business logic controller handling API requests for {base_name}."
    if file_type == 'model':
        return f"Data model / database entity definition."
    if file_type == 'component':
        return f"UI view component for rendering interface elements."
    if file_type == 'middleware':
        return f"Middleware layer handling security, authentication, or request preprocessing."
    if file_type == 'service':
        return f"Service module managing core operations and business logic."
    if file_type == 'config':
        return f"Application configuration module managing settings and environment bindings."
    
    if functions or classes:
        symbols = ", ".join(classes + functions[:3])
        return f"Source module defining {symbols}."
    return f"Source module for {base_name}."


def extract_code_metadata(file_path: str, content: str) -> Dict[str, Any]:
    """
    Extracts structured architectural metadata from a source file.
    """
    file_type = classify_file_type(file_path)
    language = detect_language(file_path)
    imports = extract_imports(content, language)
    symbols = extract_exports_and_symbols(content)
    api_endpoints = extract_api_endpoints(content, file_path)
    db_models = extract_database_models(content, file_path)
    purpose = generate_file_purpose_summary(file_path, file_type, symbols["functions"], symbols["classes"], imports)

    return {
        "file_path": file_path,
        "file_type": file_type,
        "language": language,
        "imports": imports,
        "functions": symbols["functions"],
        "classes": symbols["classes"],
        "api_endpoints": api_endpoints,
        "database_models": db_models,
        "purpose_summary": purpose,
        "excerpt": content[:800] if len(content) > 800 else content
    }
