import { useState, useRef } from "react";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";

const LANGUAGES = [
  { code: "eng", label: "English", flag: "🇬🇧" },
  { code: "lug", label: "Luganda", flag: "🇺🇬" },
  { code: "nyn", label: "Runyankole", flag: "🇺🇬" },
  { code: "teo", label: "Ateso", flag: "🇺🇬" },
  { code: "ach", label: "Acholi", flag: "🇺🇬" },
];

interface InputPanelProps {
  onSend: (message: string, language: string, audioData?: string) => void;
  onTranslate: (text: string, source: string, target: string) => void;
  loading: boolean;
}

export default function InputPanel({ onSend, onTranslate, loading }: InputPanelProps) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("lug");
  const [targetLang, setTargetLang] = useState("eng");
  const [mode, setMode] = useState<"converse" | "translate">("converse");
  const [recording, setRecording] = useState(false);
  const [audioData, setAudioData] = useState<string | undefined>();
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          setAudioData(base64);
          setText("[Voice recorded — click Send]");
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      alert("Microphone access required for voice recording");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const handleSend = () => {
    if (!text.trim() && !audioData) return;
    onSend(text || "[Voice message]", language, audioData);
    setText("");
    setAudioData(undefined);
  };

  const handleTranslate = () => {
    if (!text.trim()) return;
    onTranslate(text, language, targetLang);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      mode === "converse" ? handleSend() : handleTranslate();
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Mode tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setMode("converse")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            mode === "converse"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Voice Advisory
        </button>
        <button
          onClick={() => setMode("translate")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            mode === "translate"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Direct Translation
        </button>
      </div>

      <div className="space-y-4 p-4">
        {/* Language selector */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {mode === "converse" ? "Speak in" : "Source language"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  language === l.code
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target language (translate mode only) */}
        {mode === "translate" && (
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Target language
            </label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setTargetLang(l.code)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    targetLang === l.code
                      ? "bg-secondary text-primary-dark"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text input */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Message
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "converse"
                ? "Ask about PDM registration, documents, status..."
                : "Text to translate..."
            }
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={3}
          />
        </div>

        {/* Record + Send */}
        <div className="flex gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              recording
                ? "animate-pulse bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {recording ? "Stop" : "Record"}
          </button>

          <button
            onClick={mode === "converse" ? handleSend : handleTranslate}
            disabled={loading || (!text.trim() && !audioData)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "converse" ? (
              <Send className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? "Processing..." : mode === "converse" ? "Send" : "Translate"}
          </button>
        </div>
      </div>
    </div>
  );
}
