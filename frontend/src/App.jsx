import { useState } from 'react'
import TopicInput from './components/TopicInput'
import GuideDisplay from './components/GuideDisplay'
import DownloadButton from './components/DownloadButton'

const API_BASE = 'http://localhost:8000'

export default function App() {
  const [topics, setTopics] = useState('')
  const [courseName, setCourseName] = useState('')
  const [studyMode, setStudyMode] = useState('exam-prep')
  const [guide, setGuide] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [topicsError, setTopicsError] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleGenerate() {
    setError('')
    setTopicsError('')

    if (!topics.trim()) {
      setTopicsError('Please enter topics, paste a syllabus, or upload a PDF.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/generate-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics,
          course_name: courseName,
          study_mode: studyMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate study guide.')
      }

      setGuide(data.guide)
    } catch (err) {
      setError(err.message)
      setGuide('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            CS Study Guide Generator
          </h1>
          <p className="mt-2 text-slate-400">
            Paste your syllabus, upload lecture slides, pick a study mode, and get an AI-generated guide.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <TopicInput
              courseName={courseName}
              setCourseName={setCourseName}
              topics={topics}
              setTopics={setTopics}
              studyMode={studyMode}
              setStudyMode={setStudyMode}
              loading={loading}
              topicsError={topicsError}
              onGenerate={handleGenerate}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              uploading={uploading}
              setUploading={setUploading}
              uploadError={uploadError}
              setUploadError={setUploadError}
            />

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <div>
            <GuideDisplay guide={guide} />
            <DownloadButton guide={guide} courseName={courseName} />
          </div>
        </div>
      </div>
    </div>
  )
}
