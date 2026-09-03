import io
import re
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path

try:
    import pypdf
except ImportError:
    pypdf = None


def detect_unit_from_text_or_filename(file_name: str, sample_text: str = "") -> str:
    """
    Detects Unit / Chapter (e.g., 'Unit 1', 'Unit 2', 'Unit 3')
    from file name or first pages text.
    """
    # 1. Match from filename first (e.g., DBMS_Unit_1.pdf, Unit-2-Notes.pdf)
    fn_match = re.search(r'(?:unit|module|chapter)[\s_-]*([0-9]+|[ivx]+)', file_name, re.IGNORECASE)
    if fn_match:
        val = fn_match.group(1).upper()
        roman_map = {"I": "1", "II": "2", "III": "3", "IV": "4", "V": "5", "VI": "6"}
        unit_num = roman_map.get(val, val)
        return f"Unit {unit_num}"

    # 2. Match from header in sample text
    if sample_text:
        text_match = re.search(r'(?:UNIT|MODULE|CHAPTER)[\s:-]*([0-9]+|[IVX]+)', sample_text, re.IGNORECASE)
        if text_match:
            val = text_match.group(1).upper()
            roman_map = {"I": "1", "II": "2", "III": "3", "IV": "4", "V": "5", "VI": "6"}
            unit_num = roman_map.get(val, val)
            return f"Unit {unit_num}"

    return "Unit 1"


def clean_pdf_text(text: str) -> str:
    """Cleans raw PDF text while preserving line structure and headers."""
    if not text:
        return ""
    # Normalize unicode spaces & dashes
    text = text.replace('\xa0', ' ').replace('\u2013', '-').replace('\u2014', '--')
    # Remove null bytes
    text = text.replace('\x00', '')
    # Strip excessive horizontal spaces while keeping paragraph breaks
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n')]
    cleaned = '\n'.join(lines)
    # Remove 3+ consecutive empty newlines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()


def detect_diagrams_in_text(page_text: str) -> Tuple[bool, Optional[str]]:
    """
    Detects if the page mentions a diagram, flowchart, figure, architecture, or table.
    """
    diagram_patterns = [
        r'(?:Figure|Fig\.|Diagram|Architecture|Flowchart|Circuit|Graph|Block Diagram|Table)[\s:-]*([^\n.]+)',
        r'(?:Refer to the diagram below|shown in the figure|as illustrated below)',
    ]
    for pattern in diagram_patterns:
        match = re.search(pattern, page_text, re.IGNORECASE)
        if match:
            caption = match.group(0).strip()
            if len(caption) > 100:
                caption = caption[:100] + "..."
            return True, caption
    return False, None


def extract_pages_from_pdf(file_bytes: bytes, file_name: str = "") -> List[Dict[str, Any]]:
    """
    Extracts text, page numbers, detected unit, and diagram markers from PDF bytes.
    """
    pages_data = []
    if not file_bytes:
        return pages_data

    if not pypdf:
        # Fallback text extractor if pypdf is missing
        text_content = file_bytes.decode('utf-8', errors='ignore')
        if text_content.strip():
            pages_data.append({
                "page_number": 1,
                "text": clean_pdf_text(text_content),
                "has_diagram": False,
                "diagram_caption": None,
                "unit": detect_unit_from_text_or_filename(file_name, text_content[:500])
            })
        return pages_data

    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        if total_pages == 0:
            return []

        # Detect primary unit for document
        first_few_pages_text = ""
        for p in reader.pages[:min(3, total_pages)]:
            first_few_pages_text += (p.extract_text() or "") + " "
        doc_unit = detect_unit_from_text_or_filename(file_name, first_few_pages_text)

        for idx, page in enumerate(reader.pages, start=1):
            raw_text = page.extract_text() or ""
            cleaned = clean_pdf_text(raw_text)
            if not cleaned:
                continue

            has_diag, diag_caption = detect_diagrams_in_text(cleaned)

            # Check if page has local unit override
            page_unit = detect_unit_from_text_or_filename(file_name, cleaned[:300]) or doc_unit

            pages_data.append({
                "page_number": idx,
                "text": cleaned,
                "has_diagram": has_diag,
                "diagram_caption": diag_caption,
                "unit": page_unit or doc_unit
            })
    except Exception as e:
        print(f"[PDF Processor Error] Error processing {file_name}: {e}")
        # Fallback raw text parsing
        raw_str = file_bytes.decode('utf-8', errors='ignore')
        if raw_str.strip():
            pages_data.append({
                "page_number": 1,
                "text": clean_pdf_text(raw_str),
                "has_diagram": False,
                "diagram_caption": None,
                "unit": detect_unit_from_text_or_filename(file_name, raw_str[:300])
            })

    return pages_data


def process_study_pdf(file_name: str, file_bytes: bytes) -> Dict[str, Any]:
    """
    High-level entry point to process a single study PDF.
    Returns page count, detected unit, and list of parsed pages.
    """
    pages = extract_pages_from_pdf(file_bytes, file_name)
    primary_unit = detect_unit_from_text_or_filename(file_name, pages[0]["text"] if pages else "")
    return {
        "file_name": file_name,
        "file_size": len(file_bytes),
        "page_count": len(pages),
        "primary_unit": primary_unit,
        "pages": pages
    }
