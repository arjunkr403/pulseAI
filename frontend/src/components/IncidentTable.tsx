import { useEffect, useState } from "react";
import { fetchIncidents } from "../api/client";
import type { Incident } from "../types";
import IncidentModal from "./IncidentModal";

interface IncidentTableProps {
  refresh: number;
}

function StatusBadge({ executed }: { executed: boolean }) {
  return executed ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
      Executed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
      Rejected
    </span>
  );
}

export default function IncidentTable({ refresh }: IncidentTableProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Incident | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchIncidents();
        setIncidents(data);
        setError(null);
      } catch {
        setError("Failed to load incidents");
      }
    };
    load();
  }, [refresh]);

  return (
    <>
      {selected && (
        <IncidentModal incident={selected} onClose={() => setSelected(null)} />
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">
            Incident history
          </h2>
          <span className="text-xs text-gray-400">
            {incidents.length} incidents
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {!error && incidents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No incidents found.</p>
            <p className="text-xs text-gray-300 mt-1">
              Run a scan to detect anomalies.
            </p>
          </div>
        )}

        {incidents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-6 uppercase tracking-wide">
                    Time
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-6 uppercase tracking-wide">
                    CPU
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-6 uppercase tracking-wide">
                    Latency
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-6 uppercase tracking-wide">
                    Fix type
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-6 uppercase tracking-wide">
                    Summary
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {incidents.map((incident) => {
                  const fix = (() => {
                    try {
                      return JSON.parse(incident.suggested_fix);
                    } catch {
                      return null;
                    }
                  })();
                  return (
                    <tr
                      key={incident.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelected(incident)}
                    >
                      <td className="py-3.5 pr-6 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(incident.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 pr-6 text-sm font-medium text-gray-900">
                        {incident.cpu_usage.toFixed(1)}%
                      </td>
                      <td className="py-3.5 pr-6 text-sm font-medium text-gray-900">
                        {incident.latency_p95.toFixed(1)}ms
                      </td>
                      <td className="py-3.5 pr-6">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {incident.fix_type || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-6 text-sm text-gray-600 max-w-xs">
                        <span className="line-clamp-1">
                          {fix ? fix.anomaly_reason : incident.suggested_fix}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <StatusBadge executed={incident.executed} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
