import { useEffect, useState } from "react";
import { getResources } from "../api/endpoints";
import type { ResourceAllocation } from "../types";
import StatusBadge from "../components/shared/StatusBadge";
import DistributionForm from "../components/resources/DistributionForm";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { Package } from "lucide-react";

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getResources().then((data) => {
      setResources(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Distribution</h1>
          <p className="text-sm text-gray-500">Track and manage PDM resource allocations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
        >
          Log Distribution
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">Parish</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Distributed</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((res) => {
                const pct = Math.round((res.distributed_count / res.quantity) * 100);
                return (
                  <tr key={res.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{res.resource_type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{res.parish}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{res.quantity}</td>
                    <td className="px-5 py-3 text-gray-600">{res.distributed_count}</td>
                    <td className="px-5 py-3">
                      <div className="w-24">
                        <div className="h-2 rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${
                              pct >= 100 ? "bg-green-500" : pct > 50 ? "bg-orange-400" : "bg-blue-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{pct}%</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={res.distribution_status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                      {new Date(res.allocation_date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <DistributionForm
          resources={resources}
          onClose={() => setShowForm(false)}
          onDistribute={() => {
            getResources().then(setResources);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
