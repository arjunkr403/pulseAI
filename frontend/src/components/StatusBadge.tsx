interface StatusBadgeProps {
  status: "executed" | "rejected" | "pending";
}

const config = {
  executed: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded border ${config[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
