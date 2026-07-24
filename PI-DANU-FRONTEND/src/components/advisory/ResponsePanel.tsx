import type { ConverseResult } from "../../types";
import { Globe, Brain, Volume2, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";

interface ResponsePanelProps {
  result: ConverseResult | null;
}

export default function ResponsePanel({ result }: ResponsePanelProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!result?.audio_url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(result.audio_url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <Globe className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-400">AI response will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Detected language */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-indigo-500" />
          <p className="text-xs font-medium text-gray-500">Detected Language</p>
        </div>
        <p className="mt-1 text-lg font-semibold text-gray-900">
          {result.detected_language.toUpperCase()}
        </p>
      </div>

      {/* Intent */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" />
          <p className="text-xs font-medium text-gray-500">Detected Intent</p>
        </div>
        <p className="mt-1 inline-block rounded-full bg-purple-50 px-3 py-1 text-sm font-semibold text-purple-700">
          {result.intent.replace(/_/g, " ")}
        </p>
      </div>

      {/* Response in local language */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Response (Local Language)
        </p>
        <p className="text-sm leading-relaxed text-gray-800">{result.reply_local}</p>
      </div>

      {/* Response in English */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Response (English)
        </p>
        <p className="text-sm leading-relaxed text-gray-600">{result.reply_text}</p>
      </div>

      {/* Audio player */}
      {result.audio_url && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-light"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700">Audio Response (TTS)</p>
              <p className="text-[10px] text-gray-400">
                {playing ? "Playing..." : "Click to play AI-generated speech"}
              </p>
            </div>
            <Volume2 className="h-4 w-4 text-gray-300" />
          </div>
          <audio
            src={result.audio_url}
            onEnded={() => setPlaying(false)}
            ref={(el) => {
              if (el) audioRef.current = el;
            }}
          />
        </div>
      )}
    </div>
  );
}
