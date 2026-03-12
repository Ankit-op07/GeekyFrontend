"use client";

import { useState } from "react";
import { Play } from "lucide-react";

export function InteractiveCodeBlock({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCode = () => {
    setOutput(null);
    setError(null);

    const logs: string[] = [];
    const originalLog = console.log;

    // Capture console.log
    console.log = (...args) => {
      logs.push(
        args
          .map((a) =>
            typeof a === "object" ? JSON.stringify(a, null, 2) : String(a),
          )
          .join(" "),
      );
    };

    try {
      // Evaluates code in an isolated functional scope
      new Function(code)();
      if (logs.length > 0) {
        setOutput(logs.join("\n"));
      } else {
        setOutput("// Code ran successfully (no output)");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      // Restore console.log
      console.log = originalLog;
    }
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d0d1a]">
      {/* The pre/code node built by server/TipTap */}
      <div className="relative">
        {children}

        {/* Run button - absolute top right */}
        <button
          onClick={runCode}
          className="absolute top-3 right-3 opacity-90 hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-md shadow-md z-10"
          title="Run JavaScript Code"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          Run
        </button>
      </div>

      {/* Output Panel */}
      {(output !== null || error !== null) && (
        <div className="border-t border-white/10 bg-black/40 p-4 text-sm font-mono overflow-x-auto">
          <div className="text-xs text-slate-400 mb-2 font-sans font-semibold uppercase tracking-wider">
            Console Output
          </div>
          {error !== null ? (
            <div className="text-red-400 whitespace-pre-wrap">{error}</div>
          ) : (
            <div className="text-emerald-400 whitespace-pre-wrap">{output}</div>
          )}
        </div>
      )}
    </div>
  );
}
