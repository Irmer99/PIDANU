import { useState } from "react";
import { converse, translateText } from "../api/endpoints";
import type { ConverseResult, ConversationEntry, PipelineStep } from "../types";
import InputPanel from "../components/advisory/InputPanel";
import PipelineFlow from "../components/advisory/PipelineFlow";
import ResponsePanel from "../components/advisory/ResponsePanel";
import ConversationHistory from "../components/advisory/ConversationHistory";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function buildPipelineSteps(hasAudio: boolean): PipelineStep[] {
  const steps: PipelineStep[] = [];
  if (hasAudio) {
    steps.push({
      id: "stt",
      label: "Speech-to-Text",
      status: "pending",
      detail: "Converting voice to text via Sunbird AI",
    });
  }
  steps.push(
    {
      id: "detect",
      label: "Language Detection",
      status: "pending",
      detail: "Identifying the input language",
    },
    {
      id: "translate_in",
      label: "Translation → English",
      status: "pending",
      detail: "Translating to English for intent processing",
    },
    {
      id: "intent",
      label: "Intent Detection",
      status: "pending",
      detail: "Classifying the citizen's request",
    },
    {
      id: "response",
      label: "Response Generation",
      status: "pending",
      detail: "Generating appropriate PDM advisory",
    },
    {
      id: "translate_out",
      label: "Back-Translation",
      status: "pending",
      detail: "Translating response back to local language",
    },
    {
      id: "tts",
      label: "Text-to-Speech",
      status: "pending",
      detail: "Generating audio in the citizen's language",
    }
  );
  return steps;
}

export default function AdvisoryPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConverseResult | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [history, setHistory] = useState<ConversationEntry[]>([]);

  const animateSteps = async (allSteps: PipelineStep[], hasAudio: boolean) => {
    const startIdx = hasAudio ? 0 : 1;
    for (let i = startIdx; i < allSteps.length; i++) {
      allSteps[i].status = "processing";
      setSteps([...allSteps]);
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
      allSteps[i].status = "completed";
      setSteps([...allSteps]);
    }
  };

  const handleSend = async (message: string, language: string, audioData?: string) => {
    setLoading(true);
    setResult(null);
    const pipelineSteps = buildPipelineSteps(!!audioData);
    setSteps([...pipelineSteps]);

    animateSteps(pipelineSteps, !!audioData);

    try {
      const res = await converse({
        message,
        language_preference: language,
        audio_data: audioData,
        phone_number: "+256700000000",
      });

      pipelineSteps.forEach((s) => (s.status = "completed"));
      setSteps([...pipelineSteps]);
      setResult(res);

      const entry: ConversationEntry = {
        id: uid(),
        user_input: message,
        input_type: audioData ? "audio" : "text",
        language_preference: language,
        result: res,
        steps: [...pipelineSteps],
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => [...prev, entry]);
    } catch {
      pipelineSteps.forEach((s) => {
        if (s.status === "processing") s.status = "error";
      });
      setSteps([...pipelineSteps]);
    }
    setLoading(false);
  };

  const handleTranslate = async (text: string, source: string, target: string) => {
    setLoading(true);
    setResult(null);
    setSteps([
      { id: "translate_in", label: `Translation ${source.toUpperCase()} → ${target.toUpperCase()}`, status: "processing", detail: "Translating via Sunbird AI" },
    ]);

    try {
      const res = await translateText({ text, source_language: source, target_language: target });
      setSteps((prev) =>
        prev.map((s) => ({ ...s, status: "completed" as const, output: res.translated_text }))
      );

      const converseResult: ConverseResult = {
        reply_text: res.translated_text,
        reply_local: res.translated_text,
        detected_language: source,
        intent: "translation",
        audio_url: null,
        user_id: null,
      };
      setResult(converseResult);

      setHistory((prev) => [
        ...prev,
        {
          id: uid(),
          user_input: text,
          input_type: "text",
          language_preference: source,
          result: converseResult,
          steps: [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setSteps((prev) => prev.map((s) => ({ ...s, status: "error" as const })));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Voice Advisory</h1>
        <p className="text-sm text-gray-500">
          Sunbird AI translation & voice flows — multilingual citizen advisory
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Input */}
        <div>
          <InputPanel onSend={handleSend} onTranslate={handleTranslate} loading={loading} />
        </div>

        {/* Pipeline */}
        <div>
          <PipelineFlow steps={steps} />
        </div>

        {/* Response */}
        <div>
          <ResponsePanel result={result} />
        </div>
      </div>

      {/* History */}
      <ConversationHistory entries={history} />

      {/* How it works */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">How It Works</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-indigo-50 p-4">
            <p className="mb-1 text-xs font-semibold text-indigo-700">Multi-language Input</p>
            <p className="text-xs text-indigo-600">
              Citizens speak or type in Luganda, Runyankole, Ateso, Acholi, or English.
            </p>
          </div>
          <div className="rounded-lg bg-violet-50 p-4">
            <p className="mb-1 text-xs font-semibold text-violet-700">AI Translation</p>
            <p className="text-xs text-violet-600">
              Sunbird NLLB model translates to English for intent processing and back for the
              response.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <p className="mb-1 text-xs font-semibold text-green-700">Targeted Advice</p>
            <p className="text-xs text-green-600">
              Intent detection routes citizens to the right PDM information — registration,
              status, scam warnings.
            </p>
          </div>
          <div className="rounded-lg bg-teal-50 p-4">
            <p className="mb-1 text-xs font-semibold text-teal-700">Voice Response</p>
            <p className="text-xs text-teal-600">
              TTS generates spoken audio in the citizen's language for low-literacy users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
