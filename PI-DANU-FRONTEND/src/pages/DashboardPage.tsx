import { useEffect, useState } from "react";
import { getMetrics, getRequests } from "../api/endpoints";
import type { Metrics, ServiceRequest } from "../types";
import MetricsCards from "../components/dashboard/MetricsCards";
import RecentRequests from "../components/dashboard/RecentRequests";
import ParishOverview from "../components/dashboard/ParishOverview";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMetrics(), getRequests()]).then(([m, r]) => {
      setMetrics(m);
      setRequests(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of public service delivery</p>
      </div>

      {metrics && <MetricsCards metrics={metrics} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentRequests requests={requests} />
        </div>
        <div>
          {metrics && <ParishOverview data={metrics.requests_by_type} />}
        </div>
      </div>
    </div>
  );
}
