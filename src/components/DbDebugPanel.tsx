"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Step = {
  step: string;
  status: "ok" | "fail";
  detail: string;
};

type DebugResult = {
  steps: Step[];
};

export default function DbDebugPanel() {
  const [result, setResult] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/debug-db");
      const data = (await res.json()) as DebugResult;
      setResult(data);
    } catch (err) {
      setResult({
        steps: [
          {
            step: "fetch /api/debug-db",
            status: "fail",
            detail: err instanceof Error ? err.message : String(err),
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => void run()}
        disabled={loading}
        className="rounded-full text-xs opacity-70 hover:opacity-100"
      >
        {loading ? "Running…" : "DB Diagnostics"}
      </Button>

      {result && (
        <div className="max-w-sm rounded-xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur text-xs font-mono space-y-1">
          <p className="font-semibold text-sm mb-2">DB Diagnostics</p>
          {result.steps.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className={s.status === "ok" ? "text-green-500" : "text-red-500"}>
                {s.status === "ok" ? "✓" : "✗"}
              </span>
              <div>
                <span className="font-semibold">{s.step}</span>
                <div className="text-muted-foreground break-all">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
