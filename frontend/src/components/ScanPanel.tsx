import { useState } from 'react'
import { scanCluster, approveFix } from '../api/client'
import type { ScanResult } from '../types'
import AnomalyPanel from './AnomalyPanel'
import FollowUpChat from './FollowUpChat'

interface ScanPanelProps {
  onStatusChange: (status: 'idle' | 'scanning' | 'anomaly' | 'executing') => void
  onScanComplete: () => void
}

export default function ScanPanel({ onStatusChange, onScanComplete }: ScanPanelProps) {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [fixResult, setFixResult] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleScan = async () => {
    setLoading(true)
    setResult(null)
    setMessage(null)
    setError(null)
    setFixResult('')
    onStatusChange('scanning')

    try {
      const data = await scanCluster()
      setResult(data)
      onStatusChange(data.anomaly_detected ? 'anomaly' : 'idle')
    } catch {
      setError('Scan failed. Is the backend running?')
      onStatusChange('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (approved: boolean) => {
    if (!result) return
    setApproving(true)
    onStatusChange('executing')

    try {
      const res = await approveFix(result.thread_id, approved)
      setFixResult(res.fix_result || '')
      setMessage(approved ? '✓ Fix executed successfully.' : '✗ Fix rejected.')
      setResult(prev => prev ? { ...prev, requires_approval: false } : null)
      onScanComplete()
    } catch {
      setError('Approval failed.')
    } finally {
      setApproving(false)
      onStatusChange('idle')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Agent scan</h2>
      <p className="text-xs text-gray-400 mb-4">
        Triggers LangGraph agent to analyze cluster metrics via Groq LLM
      </p>

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium py-3 rounded-xl transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Scanning cluster...
          </span>
        ) : 'Scan cluster'}
      </button>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {message && !result?.requires_approval && (
        <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3">
          <p className="text-sm text-green-600">{message}</p>
          {fixResult && (
            <p className="text-xs text-green-500 mt-1">{fixResult}</p>
          )}
        </div>
      )}

      {result && result.anomaly_detected && result.requires_approval && (
        <AnomalyPanel
          suggested_fix={result.suggested_fix}
          fix_type={result.fix_type}
          fix_result={fixResult}
          onApprove={() => handleApproval(true)}
          onReject={() => handleApproval(false)}
          approving={approving}
        />
      )}

      {result && !result.anomaly_detected && (
        <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <p className="text-sm text-green-700 font-medium">System healthy</p>
          </div>
          <p className="text-xs text-green-600 mt-1">No anomalies detected.</p>
        </div>
      )}

      {result && result.thread_id && (
        <FollowUpChat thread_id={result.thread_id} />
      )}
    </div>
  )
}