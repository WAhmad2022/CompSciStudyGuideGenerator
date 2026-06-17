import { useRef } from 'react'

const API_BASE = 'http://localhost:8000'

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-accent"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function formatExtractedText(files) {
  return files
    .map(({ filename, text }) => `--- From ${filename} ---\n${text}`)
    .join('\n\n')
}

export default function FileUpload({
  uploadedFiles,
  setUploadedFiles,
  topics,
  setTopics,
  uploading,
  setUploading,
  uploadError,
  setUploadError,
}) {
  const inputRef = useRef(null)

  async function handleFiles(fileList) {
    const pdfs = Array.from(fileList).filter((f) =>
      f.name.toLowerCase().endsWith('.pdf')
    )

    if (pdfs.length === 0) {
      setUploadError('Please upload PDF files only (slides or syllabus).')
      return
    }

    if (uploadedFiles.length + pdfs.length > 5) {
      setUploadError('Maximum 5 PDF files allowed.')
      return
    }

    setUploading(true)
    setUploadError('')

    const formData = new FormData()
    pdfs.forEach((file) => formData.append('files', file))

    try {
      const response = await fetch(`${API_BASE}/extract-pdf`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to extract text from PDF.')
      }

      const newFiles = data.files.filter(
        (f) => !uploadedFiles.some((u) => u.filename === f.filename)
      )

      if (newFiles.length === 0) {
        setUploadError('These files have already been uploaded.')
        return
      }

      const updatedFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(updatedFiles)

      const extractedBlock = formatExtractedText(newFiles)
      setTopics(topics.trim() ? `${topics.trim()}\n\n${extractedBlock}` : extractedBlock)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleInputChange(e) {
    if (e.target.files?.length) handleFiles(e.target.files)
  }

  function handleDrop(e) {
    e.preventDefault()
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  function removeFile(filename) {
    const file = uploadedFiles.find((f) => f.filename === filename)
    if (!file) return

    const block = `--- From ${filename} ---\n${file.text}`
    setTopics(
      topics
        .replace(block, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    )
    setUploadedFiles(uploadedFiles.filter((f) => f.filename !== filename))
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        Upload Slides or Syllabus (PDF)
      </span>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="rounded-lg border border-dashed border-slate-600 bg-slate-900/50 p-4 transition hover:border-slate-500"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleInputChange}
          className="hidden"
          id="pdf-upload"
          disabled={uploading}
        />
        <label
          htmlFor="pdf-upload"
          className={`flex cursor-pointer flex-col items-center gap-2 text-center ${
            uploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {uploading ? (
            <>
              <Spinner />
              <span className="text-sm text-slate-400">Extracting text from PDF...</span>
            </>
          ) : (
            <>
              <svg
                className="h-8 w-8 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-sm text-slate-300">
                Drop PDFs here or <span className="text-accent">browse</span>
              </span>
              <span className="text-xs text-slate-500">
                Lecture slides or syllabus · up to 5 files · 20 MB each
              </span>
            </>
          )}
        </label>
      </div>

      {uploadError && (
        <p className="mt-1.5 text-sm text-red-400">{uploadError}</p>
      )}

      {uploadedFiles.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {uploadedFiles.map((file) => (
            <li
              key={file.filename}
              className="flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-300"
            >
              <svg className="h-3.5 w-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
              <span className="max-w-[180px] truncate">{file.filename}</span>
              <button
                type="button"
                onClick={() => removeFile(file.filename)}
                className="ml-0.5 text-slate-500 hover:text-red-400"
                aria-label={`Remove ${file.filename}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
