"use client";

import { useSettings } from "@/lib/settingsContext";

export default function Footer() {
  const { isModified } = useSettings();

  return (
    <footer className="border-t border-slate-800/60 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-700 font-medium tracking-wide">
          TPMO Portfolio Intelligence
        </span>
        <div className="flex items-center gap-4">
          {isModified && (
            <span className="text-xs text-blue-500/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Settings modified
            </span>
          )}
          <span className="text-xs text-slate-700">
            Data refreshes every 60s
          </span>
        </div>
      </div>
    </footer>
  );
}
