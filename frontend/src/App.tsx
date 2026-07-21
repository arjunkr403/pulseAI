import { useState } from "react";
import Header from "./components/Header";
import MetricsPanel from "./components/MetricsPanel";
import ScanPanel from "./components/ScanPanel";
import IncidentTable from "./components/IncidentTable";

type AgentStatus = "idle" | "scanning" | "anomaly" | "executing";

export default function App() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header agentStatus={agentStatus} />
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <MetricsPanel />
          <ScanPanel
            onStatusChange={setAgentStatus}
            onScanComplete={() => setRefresh((r) => r + 1)}
          />
        </div>
        <IncidentTable refresh={refresh} />
      </main>
    </div>
  );
}
