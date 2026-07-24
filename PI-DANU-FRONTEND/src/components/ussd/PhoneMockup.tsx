import { useState } from "react";
import UssdDisplay from "./UssdDisplay";

interface PhoneMockupProps {
  response: string;
  onSend: (text: string) => void;
  loading: boolean;
  disabled: boolean;
}

export default function PhoneMockup({ response, onSend, loading, disabled }: PhoneMockupProps) {
  const [inputBuffer, setInputBuffer] = useState("");

  const handleDigit = (d: string) => setInputBuffer((p) => p + d);
  const handleClear = () => setInputBuffer("");
  const handleBackspace = () => setInputBuffer((p) => p.slice(0, -1));

  const handleSend = () => {
    if (disabled || loading) return;
    onSend(inputBuffer);
    setInputBuffer("");
  };

  const handleSelectOption = (num: string) => {
    onSend(num);
  };

  return (
    <div className="mx-auto w-[320px] overflow-hidden rounded-[2.5rem] border-4 border-gray-800 bg-white shadow-2xl">
      {/* Status bar */}
      <div className="flex items-center justify-between bg-gray-800 px-5 py-2 text-[10px] text-white/80">
        <span className="font-semibold">UGANDA</span>
        <span className="font-mono">*384*01#</span>
        <span>3G</span>
      </div>

      {/* USSD header */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          USSD Service
        </p>
      </div>

      {/* Response area */}
      <div className="min-h-[260px] max-h-[320px] overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Processing...
          </div>
        ) : response ? (
          <UssdDisplay response={response} onSelectOption={handleSelectOption} />
        ) : (
          <p className="text-sm text-gray-300 italic">
            Tap "Start Session" to begin...
          </p>
        )}
      </div>

      {/* Input display */}
      {inputBuffer && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
          <p className="font-mono text-sm text-primary">{inputBuffer}</p>
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-1 border-t border-gray-200 bg-gray-100 p-2">
        {["1", "2", "3", "A"].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            disabled={disabled}
            className="flex h-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-200 disabled:opacity-40"
          >
            {d}
          </button>
        ))}
        {["4", "5", "6", "B"].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            disabled={disabled}
            className="flex h-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-200 disabled:opacity-40"
          >
            {d}
          </button>
        ))}
        {["7", "8", "9", "C"].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            disabled={disabled}
            className="flex h-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-200 disabled:opacity-40"
          >
            {d}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={disabled}
          className="flex h-10 items-center justify-center rounded-lg bg-white text-xs font-medium text-gray-500 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          CLR
        </button>
        <button
          onClick={() => handleDigit("0")}
          disabled={disabled}
          className="flex h-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-200 disabled:opacity-40"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={disabled}
          className="flex h-10 items-center justify-center rounded-lg bg-white text-xs font-medium text-gray-500 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          ⌫
        </button>
        <button
          onClick={handleSend}
          disabled={disabled || loading}
          className="flex h-10 items-center justify-center rounded-lg bg-green-600 text-xs font-bold text-white shadow-sm transition-colors hover:bg-green-700 active:bg-green-800 disabled:opacity-40"
        >
          SEND
        </button>
      </div>

      {/* Bottom bar */}
      <div className="h-3 bg-gray-800" />
    </div>
  );
}
