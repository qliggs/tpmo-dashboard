export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-700 font-medium tracking-wide">
          TPMO Portfolio Intelligence
        </span>
        <span className="text-xs text-slate-700">
          Data refreshes every 60s
        </span>
      </div>
    </footer>
  );
}
