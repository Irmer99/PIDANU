import { useEffect, useState } from "react";
import { getRequests, actOnRequest } from "../api/endpoints";
import type { ServiceRequest } from "../types";
import StatusBadge from "../components/shared/StatusBadge";
import RequestCard from "../components/requests/RequestCard";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import toast from "react-hot-toast";

const statusFilters = ["all", "submitted", "under_review", "approved", "rejected", "completed"];
const typeFilters = ["all", "birth_cert", "land_permit", "agri_inputs", "infra_report"];
const typeLabels: Record<string, string> = {
  all: "All Types",
  birth_cert: "Birth Certificate",
  land_permit: "Land Permit",
  agri_inputs: "Agricultural Inputs",
  infra_report: "Infrastructure Report",
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, [statusFilter, typeFilter]);

  const loadRequests = async () => {
    setLoading(true);
    const result = await getRequests({ status: statusFilter, type: typeFilter });
    setRequests(result.data);
    setLoading(false);
  };

  const handleAction = async (id: string, action: "approve" | "reject", notes: string) => {
    await actOnRequest(id, action, notes);
    toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`);
    setSelectedRequest(null);
    loadRequests();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        <p className="text-sm text-gray-500">Review and manage citizen service requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {statusFilters.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {typeFilters.map((t) => (
            <option key={t} value={t}>
              {typeLabels[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : requests.length === 0 ? (
        <EmptyState title="No requests found" message="No requests match your filters" />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Citizen</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Via</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="cursor-pointer border-b border-gray-50 hover:bg-gray-50"
                  >
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
                    <td className="px-5 py-3">
                      <StatusBadge status={req.priority} />
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 uppercase">
                      {req.submitted_via}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                      {new Date(req.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedRequest && (
        <RequestCard
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
