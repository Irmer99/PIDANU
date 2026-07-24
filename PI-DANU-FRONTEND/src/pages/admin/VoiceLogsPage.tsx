import { Phone, Clock, Search } from "lucide-react";

interface VoiceLog {
  id: string;
  caller: string;
  duration: string;
  language: string;
  intent: string;
  status: "completed" | "transferred" | "failed";
  timestamp: string;
  transcript_preview: string;
}

const MOCK_LOGS: VoiceLog[] = [
  { id: "vl-001", caller: "+256701234567", duration: "2:34", language: "Luganda", intent: "status_check", status: "completed", timestamp: "2026-07-23T14:30:00Z", transcript_preview: "Nabagamba nti... I want to check my PDM status" },
  { id: "vl-002", caller: "+256789123456", duration: "1:12", language: "Runyankole", intent: "registration_help", status: "completed", timestamp: "2026-07-23T13:15:00Z", transcript_preview: "Ndabashakira... How do I register for PDM?" },
  { id: "vl-003", caller: "+256700111222", duration: "3:45", language: "Acholi", intent: "scam_warning", status: "transferred", timestamp: "2026-07-23T11:00:00Z", transcript_preview: "I received a message saying I won money... is this real?" },
  { id: "vl-004", caller: "+256755566777", duration: "0:45", language: "English", intent: "land_permit", status: "failed", timestamp: "2026-07-22T16:20:00Z", transcript_preview: "I need help with my land permit application" },
  { id: "vl-005", caller: "+256712345678", duration: "2:10", language: "Ateso", intent: "agri_inputs", status: "completed", timestamp: "2026-07-22T10:45:00Z", transcript_preview: "Amalai... I want to request farming inputs" },
];

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  transferred: "bg-yellow-50 text-yellow-700",
  failed: "bg-red-50 text-red-700",
};

export default function VoiceLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Call Logs</h1>
          <p className="text-sm text-gray-500">Monitor AI voice advisory calls from citizens</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Calls" value="247" sub="this month" color="text-primary" />
        <StatCard label="Avg Duration" value="2:15" sub="minutes" color="text-blue-600" />
        <StatCard label="Languages" value="5" sub="supported" color="text-purple-600" />
        <StatCard label="Success Rate" value="91%" sub="completed" color="text-green-600" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search by phone number..." className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none">
          <option>All Languages</option>
          <option>Luganda</option>
          <option>Runyankole</option>
          <option>Ateso</option>
          <option>Acholi</option>
          <option>English</option>
        </select>
        <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none">
          <option>All Status</option>
          <option>Completed</option>
          <option>Transferred</option>
          <option>Failed</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Caller</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Language</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Intent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Transcript</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{log.caller}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-3 w-3 text-gray-400" />
                    {log.duration}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.language}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    {log.intent.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[log.status]}`}>
                    {log.status}
                  </span>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-xs text-gray-500">{log.transcript_preview}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  );
}
