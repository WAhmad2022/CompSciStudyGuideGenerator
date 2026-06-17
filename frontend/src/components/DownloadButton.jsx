import { useState } from 'react'

const API_BASE = 'http://localhost:8000'

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
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

function sanitizeFilename(name) {
  return (name || 'study_guide').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'study_guide'
}

export default function DownloadButton({ guide, courseName }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!guide) return null

  async function handleDownload() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/download-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guide, course_name: courseName }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to generate PDF.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${sanitizeFilename(courseName)}_study_guide.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Spinner />
            Generating PDF...
          </>
        ) : (
          'Download as PDF'
        )}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
