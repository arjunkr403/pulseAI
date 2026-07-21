interface HeaderProps {
  agentStatus: "idle" | "scanning" | "anomaly" | "executing";
}

const statusConfig = {
  idle: {
    label: "● Agent idle",
    color: "bg-green-50 text-green-700 border border-green-200",
  },
  scanning: {
    label: "● Scanning...",
    color: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  anomaly: {
    label: "● Anomaly detected",
    color: "bg-red-50 text-red-700 border border-red-200",
  },
  executing: {
    label: "● Executing fix",
    color: "bg-amber-50 text-amber-700 border border-amber-200",
  },
};

export default function Header({ agentStatus }: HeaderProps) {
  const status = statusConfig[agentStatus];

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">P</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">PulseAI</h1>
          <p className="text-xs text-gray-400">
            AI-powered Kubernetes monitoring
          </p>
        </div>
      </div>
      <span
        className={`text-xs font-medium px-3 py-1.5 rounded-full ${status.color}`}
      >
        {status.label}
      </span>
    </header>
  );
}
