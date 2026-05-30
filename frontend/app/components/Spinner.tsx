import { Briefcase } from "lucide-react";

export default function Spinner({ text = "Processing..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-violet-50/30 gap-5">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <Briefcase size={14} className="text-white" />
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-semibold text-sm">{text}</p>
        <p className="text-gray-400 text-xs mt-1">This may take a few seconds</p>
      </div>
    </div>
  );
}
