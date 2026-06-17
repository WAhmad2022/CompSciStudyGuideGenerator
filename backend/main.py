import io
import os
import re

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pypdf import PdfReader
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are an expert CS study guide generator. Given a list of topics or a course syllabus, you produce structured, exam-ready study guides for university-level Computer Science students.

For each topic, always include:
- A plain-English concept summary (2-3 sentences, no assumed prior knowledge)
- 2-3 key facts or formulas a student MUST know
- One concrete real-world analogy or example
- 2 practice questions (one conceptual, one applied), with answers
- Common exam traps or misconceptions to watch out for

Output format: Use clean markdown with ## for topic headers, ### for subsections.
Do not add preamble or closing remarks. Start directly with the first topic."""

STUDY_MODE_PROMPTS = {
    "exam-prep": (
        "Focus on high-yield exam topics, common question patterns, and "
        "things professors love to test. Be concise and direct."
    ),
    "deep-dive": (
        "Go in-depth on each concept. Include edge cases, underlying theory, "
        "and connections between topics."
    ),
    "quick-review": (
        "Generate a condensed cheat-sheet style guide. Bullet points "
        "preferred. Prioritize recall over explanation."
    ),
}

MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB per file
MAX_PDF_FILES = 5
MAX_EXTRACTED_CHARS = 80_000


class GenerateGuideRequest(BaseModel):
    topics: str
    course_name: str
    study_mode: str


class DownloadPdfRequest(BaseModel):
    guide: str
    course_name: str


def build_user_prompt(course_name: str, topics: str, study_mode: str) -> str:
    mode_instruction = STUDY_MODE_PROMPTS.get(
        study_mode, STUDY_MODE_PROMPTS["exam-prep"]
    )
    return (
        f"{mode_instruction}\n\n"
        f"Course: {course_name}\n\n"
        f"Topics/Syllabus:\n{topics}"
    )


def strip_inline_markdown(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    return text


def escape_xml(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def guide_to_paragraphs(guide: str, styles: dict) -> list:
    elements = []
    for line in guide.splitlines():
        stripped = line.strip()
        if not stripped:
            elements.append(Spacer(1, 6))
            continue

        if stripped.startswith("## "):
            text = escape_xml(stripped[3:])
            elements.append(Paragraph(f"<b>{text}</b>", styles["h2"]))
            elements.append(Spacer(1, 4))
        elif stripped.startswith("### "):
            text = escape_xml(stripped[4:])
            elements.append(Paragraph(f"<b>{text}</b>", styles["h3"]))
            elements.append(Spacer(1, 3))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            text = strip_inline_markdown(escape_xml(stripped[2:]))
            elements.append(Paragraph(f"• {text}", styles["body"]))
        else:
            text = strip_inline_markdown(escape_xml(stripped))
            elements.append(Paragraph(text, styles["body"]))

    return elements


def generate_pdf(guide: str, course_name: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=inch,
        rightMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
    )

    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "Title",
            parent=base["Heading1"],
            fontSize=18,
            leading=22,
            spaceAfter=16,
            alignment=TA_LEFT,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontSize=14,
            leading=18,
            spaceBefore=12,
            spaceAfter=6,
            alignment=TA_LEFT,
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=base["Heading3"],
            fontSize=13,
            leading=16,
            spaceBefore=8,
            spaceAfter=4,
            alignment=TA_LEFT,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontSize=12,
            leading=16,
            spaceAfter=4,
            alignment=TA_LEFT,
        ),
    }

    title = escape_xml(f"{course_name or 'CS'} Study Guide")
    elements = [
        Paragraph(f"<b>{title}</b>", styles["title"]),
        Spacer(1, 12),
        *guide_to_paragraphs(guide, styles),
    ]

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def sanitize_filename(name: str) -> str:
    safe = re.sub(r"[^\w\s-]", "", name).strip().replace(" ", "_")
    return safe or "study_guide"


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


@app.post("/extract-pdf")
async def extract_pdf(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    if len(files) > MAX_PDF_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_PDF_FILES} files allowed per upload.",
        )

    results = []
    total_chars = 0

    for upload in files:
        if not upload.filename or not upload.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"Only PDF files are supported. Got: {upload.filename or 'unknown'}",
            )

        content = await upload.read()
        if len(content) > MAX_PDF_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"{upload.filename} exceeds the 20 MB size limit.",
            )

        try:
            text = extract_text_from_pdf(content)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not read {upload.filename}: {e}",
            ) from e

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    f"No text found in {upload.filename}. "
                    "The PDF may be scanned images only."
                ),
            )

        remaining = MAX_EXTRACTED_CHARS - total_chars
        if remaining <= 0:
            break

        if len(text) > remaining:
            text = text[:remaining] + "\n\n[Content truncated due to length limit.]"

        total_chars += len(text)
        results.append({"filename": upload.filename, "text": text})

    if not results:
        raise HTTPException(
            status_code=400,
            detail="Extracted text exceeds the maximum length limit.",
        )

    return {"files": results}


@app.post("/generate-guide")
async def generate_guide(request: GenerateGuideRequest):
    if not request.topics.strip():
        raise HTTPException(status_code=400, detail="Topics field cannot be empty.")

    if request.study_mode not in STUDY_MODE_PROMPTS:
        raise HTTPException(status_code=400, detail="Invalid study mode.")

    user_prompt = build_user_prompt(
        request.course_name, request.topics, request.study_mode
    )

    try:
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        guide = message.content[0].text
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    return {"guide": guide}


@app.post("/download-pdf")
async def download_pdf(request: DownloadPdfRequest):
    if not request.guide.strip():
        raise HTTPException(status_code=400, detail="Guide text cannot be empty.")

    try:
        pdf_bytes = generate_pdf(request.guide, request.course_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    filename = f"{sanitize_filename(request.course_name)}_study_guide.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
