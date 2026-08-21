import { Gamepad2, Globe } from 'lucide-react';

interface NavbarProps {
  currency: string;
  setCurrency: (c: string) => void;
  watchlistCount: number;
}

export default function Navbar({ currency, setCurrency, watchlistCount }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-40 bg-black/60 backdrop-blur-3xl border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between text-xs tracking-tight text-gray-400">
        <div className="flex items-center gap-2 text-white font-medium cursor-pointer">
          <Gamepad2 size={16} className="text-blue-400" />
          <span className="tracking-normal font-semibold">GameTracker Pro</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10 rounded-full px-2.5 py-0.5 text-gray-300">
            <Globe size={12} />
            <select 
              className="bg-transparent text-[11px] font-medium focus:outline-none cursor-pointer"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD" className="bg-[#111]">USD ($)</option>
              <option value="EUR" className="bg-[#111]">EUR (€)</option>
              <option value="GBP" className="bg-[#111]">GBP (£)</option>
              <option value="AUD" className="bg-[#111]">AUD (A$)</option>
            </select>
          </div>
          <span className="hidden sm:inline">Watchlist ({watchlistCount})</span>
        </div>
      </div>
    </nav>
  );
}