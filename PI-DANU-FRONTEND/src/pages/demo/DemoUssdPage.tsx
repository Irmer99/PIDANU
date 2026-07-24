import { useState, useCallback } from "react";
import { simulateUssd } from "../../api/endpoints";
import type { UssdLogEntry } from "../../types";
import PhoneMockup from "../../components/ussd/PhoneMockup";
import SessionInspector from "../../components/ussd/SessionInspector";

function generateSessionId(): string {
  return "sess_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function DemoUssdPage() {
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [phoneNumber, setPhoneNumber] = useState("+256700000000");
  const [currentText, setCurrentText] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<UssdLogEntry[]>([]);
  const [started, setStarted] = useState(false);

  const sendUssd = useCallback(
    async (text: string) => {
      setLoading(true);
      const nextText = currentText ? `${currentText}*${text}` : text;
      try {
        const res = await simulateUssd({ sessionId, phoneNumber, text: nextText });
        const log: UssdLogEntry = {
          timestamp: new Date().toISOString(),
          request: { text: nextText, sessionId, phoneNumber },
          response: res,
        };
        setLogs((prev) => [...prev, log]);
        setResponse(res);
        setCurrentText(nextText);
        setStarted(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Request failed";
        setResponse(`END Error: ${msg}`);
      }
      setLoading(false);
    },
    [currentText, sessionId, phoneNumber]
  );

  const handleStart = () => {
    setCurrentText("");
    setResponse("");
    setLogs([]);
    sendUssd("");
  };

  const handleReset = () => {
    setSessionId(generateSessionId());
    setCurrentText("");
    setResponse("");
    setLogs([]);
    setStarted(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">USSD Simulator</h1>
          <p className="text-sm text-gray-500">
            Test the citizen USSD flow — dial *384*01# on any feature phone
          </p>
        </div>
        <div className="flex gap-2">
          {!started && (
            <button onClick={handleStart} disabled={loading}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50">
              Start Session
            </button>
          )}
          {started && (
            <button onClick={handleReset}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              New Session
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex justify-center lg:justify-end">
          <PhoneMockup response={response} onSend={sendUssd} loading={loading} disabled={!started} />
        </div>
        <div>
          <SessionInspector sessionId={sessionId} phoneNumber={phoneNumber} onPhoneChange={setPhoneNumber} logs={logs} onReset={handleReset} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">How It Works</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="mb-1 text-xs font-semibold text-blue-700">1. Citizen Dials</p>
            <p className="text-xs text-blue-600">Citizens dial *384*01# on any feature phone. No internet needed.</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <p className="mb-1 text-xs font-semibold text-green-700">2. Menu Navigation</p>
            <p className="text-xs text-green-600">Navigate PDM menus in English, Luganda, Runyankole, or Ateso.</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="mb-1 text-xs font-semibold text-purple-700">3. Offline First</p>
            <p className="text-xs text-purple-600">Session data syncs when connected. Works on 2G/SMS.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
