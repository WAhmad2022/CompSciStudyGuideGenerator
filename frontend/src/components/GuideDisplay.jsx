import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function GuideDisplay({ guide }) {
  if (!guide) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-slate-600 bg-card p-8">
        <p className="text-center text-slate-500">Your study guide will appear here</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-h-[70vh] overflow-y-auto rounded-xl bg-card p-6 shadow-lg">
      <article className="prose prose-invert prose-indigo max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide}</ReactMarkdown>
      </article>
    </div>
  )
}
