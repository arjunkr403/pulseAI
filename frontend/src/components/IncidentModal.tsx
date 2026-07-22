import { parseFix } from "../api/client";
import type { Incident } from "../types";
import { useState } from "react";

interface IncidentModalProps {
  incident: Incident;
  onClose: () => void;
}

const fixTypeLabel: Record<string, string> = {
  scale_up: "Scale up",
  restart_pod: "Restart pod",
  restart_gateway: "Restart gateway",
};

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function IncidentModal({
  incident,
  onClose,
}: IncidentModalProps) {
  const fix = parseFix(incident.suggested_fix);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-lg mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Incident detail
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              CPU
            </p>
            <p className="text-sm font-medium text-gray-900">
              {incident.cpu_usage.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Latency
            </p>
            <p className="text-sm font-medium text-gray-900">
              {incident.latency_p95.toFixed(1)}ms
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              RPS
            </p>
            <p className="text-sm font-medium text-gray-900">
              {incident.rps.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Pod
            </p>
            <p className="text-sm font-medium text-gray-900">
              {incident.pod_status}
            </p>
          </div>
        </div>

        {fix ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                What happened
              </p>
              <p className="text-sm text-gray-700">{fix.anomaly_reason}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Root cause
              </p>
              <p className="text-sm text-gray-700">{fix.root_cause}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Command suggested
              </p>
              <CommandBlock command={fix.kubectl_command} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{incident.suggested_fix}</p>
        )}

        {incident.fix_result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
              Fix executed
            </p>
            <p className="text-sm text-green-700">{incident.fix_result}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {new Date(incident.created_at).toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            {incident.fix_type && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {fixTypeLabel[incident.fix_type] || incident.fix_type}
              </span>
            )}
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                incident.executed
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              {incident.executed ? "Executed" : "Rejected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
