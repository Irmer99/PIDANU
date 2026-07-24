interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const colorMap: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  flagged: "bg-red-100 text-red-800",
  allocated: "bg-blue-100 text-blue-800",
  partially_distributed: "bg-orange-100 text-orange-800",
  fully_distributed: "bg-green-100 text-green-800",
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const labelMap: Record<string, string> = {
  under_review: "Under Review",
  partially_distributed: "Partial",
  fully_distributed: "Complete",
  birth_cert: "Birth Certificate",
  land_permit: "Land Permit",
  agri_inputs: "Agri Inputs",
  infra_report: "Infra Report",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const colors = colorMap[status] || "bg-gray-100 text-gray-600";
  const label = labelMap[status] || status.replace(/_/g, " ");
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center rounded-full font-medium capitalize ${colors} ${sizeClasses}`}>
      {label}
    </span>
  );
}
