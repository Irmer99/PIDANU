interface UssdDisplayProps {
  response: string;
  onSelectOption: (choice: string) => void;
}

export default function UssdDisplay({ response, onSelectOption }: UssdDisplayProps) {
  if (!response) return null;

  const isEnd = response.startsWith("END");
  const lines = response.replace(/^(CON|END)\s*/, "").split("\n");

  const numberedOptions: { num: string; text: string }[] = [];
  const otherLines: string[] = [];

  lines.forEach((line) => {
    const match = line.match(/^(\d+)\.\s+(.+)/);
    if (match) {
      numberedOptions.push({ num: match[1], text: match[2] });
    } else {
      otherLines.push(line);
    }
  });

  return (
    <div className="space-y-1 text-sm">
      {otherLines.map((line, i) => (
        <p key={i} className="whitespace-pre-line text-gray-800">
          {line}
        </p>
      ))}

      {numberedOptions.length > 0 && (
        <div className="mt-2 space-y-1">
          {numberedOptions.map((opt) => (
            <button
              key={opt.num}
              onClick={() => onSelectOption(opt.num)}
              disabled={isEnd}
              className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
                {opt.num}
              </span>
              <span className="text-gray-700">{opt.text}</span>
            </button>
          ))}
        </div>
      )}

      {isEnd && (
        <p className="mt-3 text-center text-xs font-medium text-gray-400 italic">
          Session ended
        </p>
      )}
    </div>
  );
}
