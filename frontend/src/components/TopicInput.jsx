import FileUpload from './FileUpload'

const STUDY_MODES = [
  { value: 'exam-prep', label: 'Exam Prep' },
  { value: 'deep-dive', label: 'Deep Dive' },
  { value: 'quick-review', label: 'Quick Review' },
]

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
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

export default function TopicInput({
  courseName,
  setCourseName,
  topics,
  setTopics,
  studyMode,
  setStudyMode,
  loading,
  topicsError,
  onGenerate,
  uploadedFiles,
  setUploadedFiles,
  uploading,
  setUploading,
  uploadError,
  setUploadError,
}) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-lg">
      <div className="space-y-5">
        <div>
          <label htmlFor="courseName" className="mb-1.5 block text-sm font-medium text-slate-300">
            Course Name
          </label>
          <input
            id="courseName"
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. Computer Networks, CMSC 481"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <FileUpload
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          topics={topics}
          setTopics={setTopics}
          uploading={uploading}
          setUploading={setUploading}
          uploadError={uploadError}
          setUploadError={setUploadError}
        />

        <div>
          <label htmlFor="topics" className="mb-1.5 block text-sm font-medium text-slate-300">
            Topics / Syllabus
          </label>
          <textarea
            id="topics"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="Paste your syllabus, topic list, or upload PDF slides above. e.g. DHCP, ARP, TCP, DNS, SMTP, socket programming"
            rows={8}
            className="w-full resize-y rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {topicsError && (
            <p className="mt-1.5 text-sm text-red-400">{topicsError}</p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-300">Study Mode</span>
          <div className="flex flex-wrap gap-2">
            {STUDY_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setStudyMode(mode.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  studyMode === mode.value
                    ? 'bg-accent text-white shadow-md shadow-indigo-500/30'
                    : 'border border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {loading ? (
            <>
              <Spinner />
              Generating...
            </>
          ) : (
            'Generate Study Guide'
          )}
        </button>
      </div>
    </div>
  )
}
