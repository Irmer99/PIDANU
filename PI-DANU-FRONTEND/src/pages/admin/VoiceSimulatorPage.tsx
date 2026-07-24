import { useState } from "react";
import { converse } from "../../api/endpoints";
import type { ConverseResult, PipelineStep } from "../../types";
import { Mic, Send, Volume2, Loader2 } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "lg", label: "Luganda" },
  { code: "rn", label: "Runyankole" },
  { code: "te", label: "Ateso" },
  { code: "ach", label: "Acholi" },
];

export default function VoiceSimulatorPage() {
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConverseResult | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [history, setHistory] = useState<{ input: string; result: ConverseResult; lang: string }[]>([]);

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    setLoading(true);
    setResult(null);

    const pipelineSteps: PipelineStep[] = [
      { id: "detect", label: "Language Detection", status: "processing" },
      { id: "translate", label: "Translation", status: "pending" },
      { id: "intent", label: "Intent Detection", status: "pending" },
      { id: "response", label: "Response Generation", status: "pending" },
      { id: "back_translate", label: "Back-Translation", status: "pending" },
      { id: "tts", label: "Text-to-Speech", status: "pending" },
    ];
    setSteps([...pipelineSteps]);

    try {
      // Animate pipeline steps
      for (let i = 0; i < pipelineSteps.length; i++) {
        pipelineSteps[i].status = "processing";
        setSteps([...pipelineSteps]);
        await new Promise((r) => setTimeout(r, 400));
        pipelineSteps[i].status = "completed";
        setSteps([...pipelineSteps]);
      }

      const res = await converse({
        message: message.trim(),
        language_preference: language,
        phone_number: "+256700000000",
      });

      setResult(res);
      setHistory((prev) => [{ input: message.trim(), result: res, lang: language }, ...prev]);
      setMessage("");
    } catch {
      pipelineSteps.forEach((s) => {
        if (s.status === "processing") s.status = "error";
      });
      setSteps([...pipelineSteps]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Voice Simulator</h1>
        <p className="text-sm text-gray-500">Interactive demo of the citizen voice advisory flow</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Citizen Input</h3>

          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-500">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-500">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Type in any language, e.g. 'I want to check my PDM status'..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Processing..." : "Send Message"}
          </button>

          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="mb-1 text-[10px] font-semibold text-gray-400">TRY THESE:</p>
            <div className="space-y-1">
              {["I want to check my PDM status", "How do I register?", "I received a scam message"].map((s) => (
                <button
                  key={s}
                  onClick={() => setMessage(s)}
                  className="block w-full rounded bg-white px-2 py-1 text-left text-xs text-gray-600 hover:bg-gray-100"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Processing Pipeline</h3>
          {steps.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">Send a message to see the pipeline</p>
          ) : (
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition ${
                    step.status === "completed"
                      ? "border-green-200 bg-green-50"
                      : step.status === "processing"
                      ? "border-blue-200 bg-blue-50"
                      : step.status === "error"
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.status === "completed" ? "bg-green-500 text-white" :
                    step.status === "processing" ? "bg-blue-500 text-white" :
                    step.status === "error" ? "bg-red-500 text-white" :
                    "bg-gray-200 text-gray-500"
                  }`}>
                    {step.status === "processing" ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
                  </div>
                  <span className="text-sm text-gray-700">{step.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">AI Response</h3>
          {!result ? (
            <p className="py-8 text-center text-xs text-gray-400">Response will appear here</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="mb-1 text-[10px] font-semibold text-blue-500">DETECTED LANGUAGE</p>
                <p className="text-sm font-medium text-blue-700">{result.detected_language}</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3">
                <p className="mb-1 text-[10px] font-semibold text-purple-500">INTENT</p>
                <p className="text-sm font-medium text-purple-700">{result.intent}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-[10px] font-semibold text-gray-500">RESPONSE (Local Language)</p>
                <p className="text-sm text-gray-700">{result.reply_local || result.reply_text}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-[10px] font-semibold text-gray-500">RESPONSE (English)</p>
                <p className="text-sm text-gray-700">{result.reply_text}</p>
              </div>
              {result.audio_url && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                  <Volume2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">Audio available</span>
                  <audio controls src={result.audio_url} className="ml-auto h-8" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Conversation History</h3>
          <div className="space-y-3">
            {history.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  <Mic className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{entry.input}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{entry.lang}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{entry.result.reply_local || entry.result.reply_text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
