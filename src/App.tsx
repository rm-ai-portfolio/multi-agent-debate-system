import { useState } from 'react'
import { SetupStep } from './components/SetupStep'
import { WorkflowStep } from './components/WorkflowStep'
import { DebateStep } from './components/DebateStep'
import { HistoryPanel } from './components/HistoryPanel'
import { HumanInputModal } from './components/HumanInputModal'
import { useDebateStore } from './store/useDebateStore'

type Step = 'setup' | 'workflow' | 'debate'

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('setup')
  const [historyOpen, setHistoryOpen] = useState(false)
  const startDebate = useDebateStore((s) => s.startDebate)

  const handleStartDebate = () => {
    startDebate()
    setCurrentStep('debate')
  }

  const handleLoadFromHistory = () => {
    setCurrentStep('debate')
    setHistoryOpen(false)
  }

  const stepIndex = currentStep === 'setup' ? 0 : currentStep === 'workflow' ? 1 : 2

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Step indicator (top bar) */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900/50 border-b border-gray-800/50 backdrop-blur-sm relative z-20">
        <div className="flex items-center gap-3">
          {/* Spacer for history button when it's closed */}
          <div className="w-8" />
          <h1 className="text-sm font-semibold text-gray-300 tracking-tight">
            Multi-Agent Debate
          </h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1">
          {['Setup', 'Workflow', 'Debate'].map((label, idx) => (
            <div key={label} className="flex items-center">
              <button
                onClick={() => {
                  if (idx === 0) setCurrentStep('setup')
                  else if (idx === 1 && stepIndex >= 1) setCurrentStep('workflow')
                  else if (idx === 2 && stepIndex >= 2) setCurrentStep('debate')
                }}
                disabled={idx > stepIndex}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  idx === stepIndex
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : idx < stepIndex
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === stepIndex
                      ? 'bg-blue-500/30 text-blue-300'
                      : idx < stepIndex
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-800 text-gray-600'
                  }`}
                >
                  {idx < stepIndex ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </span>
                {label}
              </button>
              {idx < 2 && (
                <svg className="w-4 h-4 text-gray-700 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* History toggle (when sidebar is open, it has its own close button) */}
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className={`p-2 rounded-lg transition ${
            historyOpen
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-gray-500 hover:text-white hover:bg-gray-800'
          }`}
          title="Toggle history"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* History sidebar */}
        <HistoryPanel
          open={historyOpen}
          onToggle={() => setHistoryOpen(!historyOpen)}
          onLoad={handleLoadFromHistory}
        />

        {/* Step content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentStep === 'setup' && (
            <SetupStep onNext={() => setCurrentStep('workflow')} />
          )}
          {currentStep === 'workflow' && (
            <WorkflowStep
              onBack={() => setCurrentStep('setup')}
              onStart={handleStartDebate}
            />
          )}
          {currentStep === 'debate' && (
            <DebateStep
              onBack={() => setCurrentStep('workflow')}
              onNewDebate={() => setCurrentStep('setup')}
            />
          )}
        </div>
      </div>

      {/* Global modals */}
      <HumanInputModal />
    </div>
  )
}
