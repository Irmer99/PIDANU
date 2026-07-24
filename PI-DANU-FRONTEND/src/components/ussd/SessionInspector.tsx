import type { UssdLogEntry } from "../../types";
import { Wifi, WifiOff, RotateCcw } from "lucide-react";

interface SessionInspectorProps {
  sessionId: string;
  phoneNumber: string;
  onPhoneChange: (v: string) => void;
  logs: UssdLogEntry[];
  onReset: () => void;
}

export default function SessionInspector({
  sessionId,
  phoneNumber,
  onPhoneChange,
  logs,
  onReset,
}: SessionInspectorProps) {
  return (
    <div className="space-y-4">
      {/* Session info */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Session Inspector</h3>
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Phone Number
            </label>
            <input
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs text-gray-700 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Session ID
            </label>
            <p className="truncate font-mono text-xs text-gray-600">{sessionId}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700">
              <Wifi className="h-3 w-3" />
              Online
            </span>
            <span className="text-[10px] text-gray-400">
              {logs.length} interaction{logs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Request/Response log */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Interaction Log</h3>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-gray-400">
              No interactions yet. Start a USSD session.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...logs].reverse().map((log, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="mb-1 text-[10px] text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString("en-GB")}
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-lg bg-blue-50 px-3 py-2">
                      <p className="text-[10px] font-semibold text-blue-600">REQUEST</p>
                      <p className="font-mono text-xs text-blue-800">
                        text="{log.request.text || "(empty)"}"
                      </p>
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        log.response.startsWith("END")
                          ? "bg-orange-50"
                          : "bg-green-50"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-semibold ${
                          log.response.startsWith("END")
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        {log.response.startsWith("END") ? "END" : "CON"}
                      </p>
                      <p className="whitespace-pre-line text-xs text-gray-700">
                        {log.response.replace(/^(CON|END)\s*/, "").slice(0, 200)}
                        {log.response.length > 200 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
