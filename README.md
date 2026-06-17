# CS Student Study Guide Generator

A full-stack web app where you paste a list of CS topics or a course syllabus, upload lecture slides or syllabus PDFs, select a study mode, and receive a structured AI-generated study guide. The guide is displayed in the UI and can be downloaded as a formatted PDF.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js (Vite), Tailwind CSS |
| Backend | FastAPI (Python) |
| AI | Anthropic API (`claude-sonnet-4-6`) via official Python SDK |
| PDF export | reportlab |
| PDF text extraction | pypdf |
| Markdown rendering | react-markdown |

## Prerequisites

- Python 3.10+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

### 1. Clone / open the project

```bash
cd StudyGuideGenerator
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create or edit `backend/.env` and add your API key:

```
ANTHROPIC_API_KEY=your_key_here
```

Replace `your_key_here` with your real key from the [Anthropic Console](https://console.anthropic.com/). **Never commit your real API key.**

Start the backend (with venv activated):

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 3. Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How to Use

1. Enter a **course name** (e.g. "Computer Networks" or "CMSC 481").
2. **Upload PDFs** (lecture slides or syllabus) and/or paste your **syllabus or topic list** into the textarea. Uploaded text is extracted and appended automatically — you can edit it before generating.
3. Choose a **study mode**:
   - **Exam Prep** — high-yield topics, common question patterns, concise and direct
   - **Deep Dive** — in-depth coverage with edge cases and theory
   - **Quick Review** — condensed cheat-sheet style with bullet points
4. Click **Generate Study Guide** and wait 10–15 seconds for the AI response.
5. Read the guide in the right panel, then click **Download as PDF** to save it.

**PDF upload limits:** up to 5 files, 20 MB each. Text-based PDFs work best; scanned/image-only PDFs may fail extraction.

## Example Inputs

**Course name:** `Computer Networks`

**Topics:**
```
DHCP, ARP, TCP, DNS, SMTP, socket programming, OSI model, routing protocols, subnetting
```

**Course name:** `CMSC 481 — Computer Security`

**Topics (syllabus excerpt):**
```
Week 1: Threat models, CIA triad
Week 2: Symmetric and asymmetric encryption, AES, RSA
Week 3: Hash functions, digital signatures
Week 4: Authentication, passwords, MFA
Week 5: Network security, firewalls, TLS
```

## API Reference

### `POST /generate-guide`

**Request body:**
```json
{
  "topics": "DHCP, ARP, TCP, DNS",
  "course_name": "Computer Networks",
  "study_mode": "exam-prep"
}
```

`study_mode` must be one of: `exam-prep`, `deep-dive`, `quick-review`.

**Response:**
```json
{
  "guide": "## DHCP\n\n..."
}
```

### `POST /extract-pdf`

Upload one or more PDF files (multipart form field: `files`).

**Response:**
```json
{
  "files": [
    { "filename": "lecture3.pdf", "text": "..." }
  ]
}
```

### `POST /download-pdf`

**Request body:**
```json
{
  "guide": "## DHCP\n\n...",
  "course_name": "Computer Networks"
}
```

**Response:** PDF file (`application/pdf`) with `Content-Disposition: attachment`.

## Project Structure

```
StudyGuideGenerator/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── TopicInput.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── GuideDisplay.jsx
│   │   │   └── DownloadButton.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `500` error on generate | Check that `ANTHROPIC_API_KEY` is set correctly in `backend/.env` |
| CORS errors | Ensure backend is running on port 8000 and frontend on port 5173 |
| Port already in use | Change the port: `uvicorn main:app --reload --port 8001` |
| Empty guide / timeout | Large syllabi may take longer; wait up to 30 seconds |

## License

MIT
