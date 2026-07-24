import type { ConversationEntry } from "../../types";
import { User, Bot, Mic } from "lucide-react";

interface ConversationHistoryProps {
  entries: ConversationEntry[];
}

export default function ConversationHistory({ entries }: ConversationHistoryProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Conversation History</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto p-4">
        <div className="space-y-4">
          {[...entries].reverse().map((entry) => (
            <div key={entry.id} className="space-y-2">
              {/* User message */}
              <div className="flex gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  {entry.input_type === "audio" ? (
                    <Mic className="h-3 w-3 text-primary" />
                  ) : (
                    <User className="h-3 w-3 text-primary" />
                  )}
                </div>
                <div className="rounded-lg rounded-tl-none bg-primary/5 px-3 py-2">
                  <p className="text-sm text-gray-800">{entry.user_input}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {entry.language_preference.toUpperCase()} ·{" "}
                    {new Date(entry.timestamp).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* AI response */}
              {entry.result && (
                <div className="flex gap-2 pl-8">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <Bot className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="rounded-lg rounded-tl-none bg-green-50 px-3 py-2">
                    <p className="text-sm text-gray-800">{entry.result.reply_local}</p>
                    <p className="mt-1 text-[10px] text-gray-400 italic">
                      {entry.result.reply_text}
                    </p>
                    <div className="mt-1.5 flex gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                        {entry.result.detected_language.toUpperCase()}
                      </span>
                      <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-purple-600">
                        {entry.result.intent.replace(/_/g, " ")}
                      </span>
                      {entry.result.audio_url && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">
                          🔊 Audio
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
