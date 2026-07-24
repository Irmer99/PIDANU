import { useEffect, useState } from "react";
import { getMonthlyReport } from "../api/endpoints";
import type { MonthlyReport } from "../types";
import StatusBadge from "../components/shared/StatusBadge";
import MonthlyReportCharts from "../components/reports/MonthlyReport";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function ReportsPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    getMonthlyReport(month, year).then((data) => {
      setReport(data);
      setLoading(false);
    });
  }, [month, year]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Reports & Audit</h1>
          <p className="text-sm text-gray-500">Automated accountability reports</p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{report.total_requests}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{report.resolved_requests}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">{report.pending_requests}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Active Citizens</p>
              <p className="mt-1 text-2xl font-bold text-primary">{report.citizens_active}</p>
            </div>
          </div>

          {/* Charts */}
          <MonthlyReportCharts />

          {/* Audit Log */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">Audit Trail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Actor</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {report.audit_logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <StatusBadge status={log.action.replace(/_/g, " ")} />
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{log.actor_phone}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 uppercase">{log.actor_role}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
