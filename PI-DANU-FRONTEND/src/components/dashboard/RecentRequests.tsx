import type { ServiceRequest } from "../../types";
import StatusBadge from "../shared/StatusBadge";

interface RecentRequestsProps {
  requests: ServiceRequest[];
}

export default function RecentRequests({ requests }: RecentRequestsProps) {
  const recent = [...requests]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">Recent Requests</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Citizen</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((req) => (
              <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-primary">
                  {req.request_code}
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{req.citizen_name}</p>
                  <p className="text-xs text-gray-400">{req.citizen_nin}</p>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={req.request_type} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={req.status} />
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                  {new Date(req.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No requests yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
