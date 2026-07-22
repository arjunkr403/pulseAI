import { useState } from "react";
import { parseFix } from "../api/client";

interface AnomalyPanelProps {
  suggested_fix: string;
  fix_type: string;
  fix_result: string;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
}

const fixTypeLabel: Record<string, string> = {
  scale_up: "Scale up",
  restart_pod: "Restart pod",
  restart_gateway: "Restart gateway",
};

const fixTypeBadge: Record<string, string> = {
  scale_up: "bg-blue-50 text-blue-700 border-blue-200",
  restart_pod: "bg-red-50 text-red-700 border-red-200",
  restart_gateway: "bg-amber-50 text-amber-700 border-amber-200",
};

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <code className="block text-xs bg-gray-900 text-green-400 rounded-lg px-3 py-2 pr-10 font-mono">
        {command}
      </code>
      <button
        onClick={copy}
        className="absolute top-1.5 right-2 text-gray-400 hover:text-white transition-colors"
        title="Copy command"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>
    </div>
  )
}


export default function AnomalyPanel({
  suggested_fix,
  fix_type,
  fix_result,
  onApprove,
  onReject,
  approving,
}: AnomalyPanelProps) {
  const fix = parseFix(suggested_fix);

  return (
    <div className="mt-4 space-y-3">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
            Anomaly detected
          </span>
          {fix_type && (
            <span
              className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full border ${fixTypeBadge[fix_type] || "bg-gray-50 text-gray-600 border-gray-200"}`}
            >
              {fixTypeLabel[fix_type] || fix_type}
            </span>
          )}
        </div>

        {fix ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">
                What's happening
              </p>
              <p className="text-sm text-gray-700">{fix.anomaly_reason}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">
                Root cause
              </p>
              <p className="text-sm text-gray-700">{fix.root_cause}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">
                Suggested command
              </p>
              <CommandBlock command={fix.kubectl_command} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{suggested_fix}</p>
        )}
      </div>

      {fix_result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
            Executed
          </p>
          <p className="text-sm text-green-700">{fix_result}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onApprove}
          disabled={approving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          {approving ? "Executing..." : "Approve fix"}
        </button>
        <button
          onClick={onReject}
          disabled={approving}
          className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-xl border border-gray-200 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
