import { useEffect, useState } from "react";
import { fetchMetrics } from "../api/client";
import type { Metrics } from "../types";

interface MetricCardProps {
  label: string;
  value: string;
  status: "normal" | "warning" | "danger";
}

function MetricCard({ label, value, status }: MetricCardProps) {
  const barColor = {
    normal: "bg-green-400",
    warning: "bg-amber-400",
    danger: "bg-red-400",
  }[status];

  const valueColor = {
    normal: "text-gray-900",
    warning: "text-amber-600",
    danger: "text-red-600",
  }[status];

  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
        {label}
      </p>
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
      <div className={`h-1 w-8 rounded-full mt-3 ${barColor}`} />
    </div>
  );
}

function getStatus(
  value: number,
  warn: number,
  danger: number,
): "normal" | "warning" | "danger" {
  if (value >= danger) return "danger";
  if (value >= warn) return "warning";
  return "normal";
}

export default function MetricsPanel() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const load = async () => {
    try {
      const data = await fetchMetrics();
      setMetrics(data);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError("Failed to fetch metrics — is the backend running?");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMetrics();
        setMetrics(data);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch {
        setError("Failed to fetch metrics — is the backend running?");
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Live metrics</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {lastUpdated ? `Updated ${lastUpdated}` : "Loading..."}
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="CPU Usage"
            value={`${metrics.cpu_usage.toFixed(1)}%`}
            status={getStatus(metrics.cpu_usage, 15, 20)}
          />
          <MetricCard
            label="P95 Latency"
            value={`${metrics.latency_p95.toFixed(1)}ms`}
            status={getStatus(metrics.latency_p95, 30, 50)}
          />
          <MetricCard
            label="RPS"
            value={metrics.rps.toFixed(2)}
            status="normal"
          />
          <MetricCard
            label="Pod Status"
            value={metrics.pod_status}
            status={metrics.pod_status === "Running" ? "normal" : "danger"}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-xl p-5 animate-pulse h-24"
            />
          ))}
        </div>
      )}
    </div>
  );
}
