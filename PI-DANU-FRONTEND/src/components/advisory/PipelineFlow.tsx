import type { PipelineStep } from "../../types";
import { Mic, Search, Globe, Brain, MessageSquare, RefreshCw, Volume2, Check, Loader2, CircleAlert } from "lucide-react";

interface PipelineFlowProps {
  steps: PipelineStep[];
}

const STEP_ICONS: Record<string, typeof Mic> = {
  stt: Mic,
  detect: Search,
  translate_in: Globe,
  intent: Brain,
  response: MessageSquare,
  translate_out: RefreshCw,
  tts: Volume2,
};

const STEP_COLORS: Record<string, { active: string; done: string; error: string }> = {
  stt: { active: "bg-blue-500", done: "bg-blue-500", error: "bg-red-500" },
  detect: { active: "bg-indigo-500", done: "bg-indigo-500", error: "bg-red-500" },
  translate_in: { active: "bg-violet-500", done: "bg-violet-500", error: "bg-red-500" },
  intent: { active: "bg-purple-500", done: "bg-purple-500", error: "bg-red-500" },
  response: { active: "bg-green-500", done: "bg-green-500", error: "bg-red-500" },
  translate_out: { active: "bg-emerald-500", done: "bg-emerald-500", error: "bg-red-500" },
  tts: { active: "bg-teal-500", done: "bg-teal-500", error: "bg-red-500" },
};

export default function PipelineFlow({ steps }: PipelineFlowProps) {
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <Brain className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-400">Send a message to see the AI pipeline</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        AI Pipeline
      </h3>
      <div className="space-y-1">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[step.id] || Brain;
          const colors = STEP_COLORS[step.id] || STEP_COLORS.intent;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-3">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[14px] top-8 h-full w-px bg-gray-200" />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  step.status === "completed"
                    ? colors.done
                    : step.status === "processing"
                    ? colors.active
                    : step.status === "error"
                    ? colors.error
                    : "bg-gray-200"
                }`}
              >
                {step.status === "processing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                ) : step.status === "completed" ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : step.status === "error" ? (
                  <CircleAlert className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Icon className="h-3.5 w-3.5 text-gray-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-3">
                <p className="text-xs font-medium text-gray-700">{step.label}</p>
                {step.output && (
                  <p className="mt-0.5 truncate text-[11px] text-gray-500">{step.output}</p>
                )}
                {step.detail && (
                  <p className="mt-0.5 text-[10px] text-gray-400">{step.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
