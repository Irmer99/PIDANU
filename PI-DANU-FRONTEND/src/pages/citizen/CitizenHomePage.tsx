import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCitizenStore } from "../../store/citizenStore";
import { ClipboardPlus, ClipboardList, Mic, Phone, Shield, ChevronRight } from "lucide-react";

export default function CitizenHomePage() {
  const { citizen, profile, requests, loadProfile, loadRequests } = useCitizenStore();

  useEffect(() => {
    loadProfile();
    loadRequests();
  }, [loadProfile, loadRequests]);

  const pendingCount = requests.filter((r) => r.status === "submitted" || r.status === "under_review").length;
  const completedCount = requests.filter((r) => r.status === "approved" || r.status === "completed").length;

  return (
    <div className="space-y-6 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Welcome back,</p>
          <h1 className="text-lg font-bold text-gray-900">{citizen?.name || "Citizen"}</h1>
          <p className="text-xs text-gray-400">{citizen?.parish}, {citizen?.district}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
          <Shield className="h-5 w-5" />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-primary">{pendingCount}</p>
          <p className="text-xs text-gray-500">Pending Requests</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Actions</h2>

        <Link to="/citizen/submit" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ClipboardPlus className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Submit a Request</p>
            <p className="text-xs text-gray-400">Birth cert, land permit, agricultural inputs...</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>

        <Link to="/citizen/requests" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">My Requests</p>
            <p className="text-xs text-gray-400">Track status of your submissions</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>

        <Link to="/demo/voice" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Mic className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Voice Advisory</p>
            <p className="text-xs text-gray-400">Ask questions in your local language</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>

        <a href="tel:*384*01#" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Phone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Dial USSD</p>
            <p className="text-xs text-gray-400">*384*01# — works on any phone, no internet</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </a>
      </div>

      {/* Recent */}
      {requests.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Recent Request</h2>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{requests[0].request_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                <p className="mt-0.5 text-xs text-gray-400">{new Date(requests[0].created_at).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                requests[0].status === "approved" ? "bg-green-50 text-green-700" :
                requests[0].status === "submitted" ? "bg-blue-50 text-blue-700" :
                requests[0].status === "rejected" ? "bg-red-50 text-red-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {requests[0].status.replace(/_/g, " ")}
              </span>
            </div>
            {requests[0].parish_chief_notes && (
              <p className="mt-2 text-xs text-gray-500 italic">"{requests[0].parish_chief_notes}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
