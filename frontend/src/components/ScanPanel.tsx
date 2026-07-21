import { useState } from "react";
import { scanCluster, approveFix } from "../api/client";
import type { ScanResult } from "../types";

interface ScanPanelProps {
  onStatusChange: (
    status: "idle" | "scanning" | "anomaly" | "executing",
  ) => void;
  onScanComplete: () => void;
}

export default function ScanPanel({
  onStatusChange,
  onScanComplete,
}: ScanPanelProps) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    setMessage(null);
    setError(null);
    onStatusChange("scanning");

    try {
      const data = await scanCluster();
      setResult(data);
      onStatusChange(data.anomaly_detected ? "anomaly" : "idle");
    } catch {
      setError("Scan failed. Is the backend running?");
      onStatusChange("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!result) return;
    setApproving(true);
    onStatusChange("executing");

    try {
      const res = await approveFix(result.thread_id, approved);
      setMessage(
        res.status === "executed"
          ? "✓ Fix executed successfully."
          : "✗ Fix rejected.",
      );
      setResult(null);
      onScanComplete();
    } catch {
      setError("Approval failed.");
    } finally {
      setApproving(false);
      onStatusChange("idle");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-sm font-semibold text-gray-900 mb-2">Agent scan</h2>
      <p className="text-xs text-gray-400 mb-5">
        Triggers LangGraph agent to analyze cluster metrics via Groq LLM
      </p>

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium py-3 rounded-xl transition-colors mb-4"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Scanning cluster...
          </span>
        ) : (
          "Scan cluster"
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-600">{message}</p>
        </div>
      )}

      {result && result.anomaly_detected && (
        <div className="flex-1 flex flex-col">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                Anomaly detected
              </p>
            </div>
            <p className="text-sm text-red-600 leading-relaxed">
              {result.suggested_fix}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleApproval(true)}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Approve fix
            </button>
            <button
              onClick={() => handleApproval(false)}
              disabled={approving}
              className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-xl border border-gray-200 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {result && !result.anomaly_detected && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <p className="text-sm text-green-700 font-medium">System healthy</p>
          </div>
          <p className="text-xs text-green-600 mt-1">No anomalies detected.</p>
        </div>
      )}
    </div>
  );
}
