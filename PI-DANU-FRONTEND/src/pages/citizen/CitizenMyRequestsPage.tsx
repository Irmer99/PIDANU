import { useEffect } from "react";
import { useCitizenStore } from "../../store/citizenStore";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; bg: string }> = {
  submitted: { color: "text-blue-600", icon: Clock, bg: "bg-blue-50" },
  under_review: { color: "text-yellow-600", icon: AlertCircle, bg: "bg-yellow-50" },
  approved: { color: "text-green-600", icon: CheckCircle, bg: "bg-green-50" },
  rejected: { color: "text-red-600", icon: XCircle, bg: "bg-red-50" },
  completed: { color: "text-green-600", icon: CheckCircle, bg: "bg-green-50" },
};

export default function CitizenMyRequestsPage() {
  const { requests, loadRequests } = useCitizenStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <div className="space-y-4 px-4 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">My Requests</h1>
          <p className="text-xs text-gray-400">{requests.length} total request{requests.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ClipboardIcon className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No requests yet</p>
          <button
            onClick={() => navigate("/citizen/submit")}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
          >
            Submit your first request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted;
            const Icon = cfg.icon;
            return (
              <div key={req.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {req.request_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{req.request_code}</p>
                    {req.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{req.description}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${cfg.bg}`}>
                    <Icon className={`h-3 w-3 ${cfg.color}`} />
                    <span className={`text-[10px] font-semibold ${cfg.color}`}>
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {req.parish_chief_notes && (
                  <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-400">Parish Chief Note</p>
                    <p className="text-xs text-gray-600 italic">"{req.parish_chief_notes}"</p>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                  <span>Submitted {new Date(req.created_at).toLocaleDateString()}</span>
                  <span>via {req.submitted_via}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}
