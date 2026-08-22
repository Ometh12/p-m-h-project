import { useState, useRef, useEffect } from 'react';
import { Gamepad2, Globe, ChevronDown, Settings, User } from 'lucide-react';

interface NavbarProps {
  currency: string;
  setCurrency: (c: string) => void;
  watchlistCount: number;
  onOpenSettings: () => void;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'AUD', label: 'AUD (A$)' },
];

export default function Navbar({ currency, setCurrency, watchlistCount, onOpenSettings }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-40 bg-black/60 backdrop-blur-3xl border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between text-xs tracking-tight text-gray-400">
        <div className="flex items-center gap-2 text-white font-medium cursor-pointer">
          <Gamepad2 size={16} className="text-blue-400" />
          <span className="tracking-normal font-semibold">GameTracker Pro</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className={`flex items-center gap-1.5 backdrop-blur-2xl backdrop-saturate-150 border rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${menuOpen ? 'bg-white/15 border-white/30 text-white' : 'bg-white/[0.06] border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'}`}
            >
              <Globe size={12} />
              {CURRENCY_OPTIONS.find(o => o.value === currency)?.label}
              <ChevronDown size={11} className={`text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute top-full right-0 mt-2 min-w-[140px] bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border border-white/15 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right p-1.5">
                {CURRENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setCurrency(opt.value); setMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-[11px] transition-colors ${currency === opt.value ? 'bg-blue-500/25 text-blue-300 font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="hidden sm:inline">Watchlist ({watchlistCount})</span>

          <div className="flex items-center gap-2 pl-1">
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border border-white/15 flex items-center justify-center text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/15 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] hover:scale-105 active:scale-95"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white border border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <User size={14} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}