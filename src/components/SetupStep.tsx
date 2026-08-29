import { useRef, useCallback, useState } from 'react'
import { useDebateStore } from '../store/useDebateStore'

interface Props {
  onNext: () => void
}

export function SetupStep({ onNext }: Props) {
  const topic = useDebateStore((s) => s.topic)
  const setTopic = useDebateStore((s) => s.setTopic)
  const documents = useDebateStore((s) => s.documents)
  const addDocuments = useDebateStore((s) => s.addDocuments)
  const removeDocument = useDebateStore((s) => s.removeDocument)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const canProceed = topic.trim().length > 0

  const processFiles = useCallback(
    (files: File[]) => {
      const mdFiles = files.filter((f) => f.name.endsWith('.md'))
      if (mdFiles.length === 0) return

      const readPromises = mdFiles.map(
        (file) =>
          new Promise<{ name: string; content: string }>((resolve) => {
            const reader = new FileReader()
            reader.onload = (ev) => {
              resolve({ name: file.name, content: ev.target?.result as string })
            }
            reader.readAsText(file)
          })
      )

      Promise.all(readPromises).then((results) => {
        addDocuments(results)
      })
    },
    [addDocuments]
  )

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Multi-Agent Debate
          </h1>
          <p className="text-gray-400 text-lg">
            Define your objective and let AI agents debate it from multiple perspectives.
          </p>
        </div>

        {/* Objective Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            What do you want debated?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Evaluate the pros and cons of microservices vs monolith architecture for our startup..."
            rows={3}
            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
          />
        </div>

        {/* File Upload Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Context documents <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-400">
                Drop .md files here or <span className="text-blue-400">browse</span>
              </p>
              <p className="text-xs text-gray-600">
                Provide background documents, requirements, or research to inform the debate
              </p>
            </div>
          </div>

          {/* Uploaded Files */}
          {documents.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {documents.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 group"
                >
                  <svg
                    className="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-300 max-w-[180px] truncate">
                    {doc.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeDocument(doc.name)
                    }}
                    className="text-gray-600 hover:text-red-400 transition ml-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-gray-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 disabled:shadow-none flex items-center gap-2"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
