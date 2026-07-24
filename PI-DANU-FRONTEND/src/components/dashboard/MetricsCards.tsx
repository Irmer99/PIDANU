import { ClipboardList, Users, AlertTriangle, Package } from "lucide-react";

interface MetricsCardsProps {
  metrics: {
    total_requests: number;
    active_citizens: number;
    pending_approvals: number;
    resources_distributed: number;
  };
}

const cards: { key: string; label: string; icon: typeof ClipboardList; color: string; suffix: string; highlight?: boolean }[] = [
  {
    key: "total_requests",
    label: "Total Requests",
    icon: ClipboardList,
    color: "bg-blue-500",
    suffix: "this month",
  },
  {
    key: "active_citizens",
    label: "Active Citizens",
    icon: Users,
    color: "bg-green-500",
    suffix: "registered",
  },
  {
    key: "pending_approvals",
    label: "Pending Approvals",
    icon: AlertTriangle,
    color: "bg-orange-500",
    suffix: "awaiting review",
    highlight: true,
  },
  {
    key: "resources_distributed",
    label: "Resources Distributed",
    icon: Package,
    color: "bg-purple-500",
    suffix: "items total",
  },
];

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const value = metrics[card.key as keyof typeof metrics] as number;
        const isUrgent = card.highlight && value > 5;
        return (
          <div
            key={card.key}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    isUrgent ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{card.suffix}</p>
              </div>
              <div className={`rounded-xl p-3 ${card.color}`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
