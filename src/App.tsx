import { useState, useEffect, useRef } from 'react';
import { Search, Bookmark, X, Bell, ExternalLink, LayoutGrid, TableProperties, Filter, Download, TrendingUp, Flame, SearchX, ArrowUpDown, ChevronUp, ChevronDown, User, Settings, Lock, ShieldCheck, LogOut, Grid3X3, Columns, ShieldAlert, Percent, Coins } from 'lucide-react';
import { STORE_MAP, formatPrice, getHighResImage, CURRENCY_RATES } from './utils';
import Navbar from './components/Navbar';
import InteractiveChart from './components/InteractiveChart';
import { supabase } from './supabaseClient';

interface Deal { gameID: string; title: string; salePrice: string; normalPrice: string; savings: string; thumb: string; }
interface SearchResult { gameID: string; external: string; cheapest: string; thumb: string; }
interface WatchlistItem { id: string; title: string; targetPrice: number; }

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'data' | 'global'>('data');

  // --- NEW: Advanced Matrix & Global Settings State ---
  const [showGridlines, setShowGridlines] = useState(false);
  const [autoFitColumns, setAutoFitColumns] = useState(false);
  const [safeDelete, setSafeDelete] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  const [globalDealFloor, setGlobalDealFloor] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('USD');

  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('appleWatchlist');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.filter((item: any) => item.id !== undefined && item.id !== null);
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [minDiscount, setMinDiscount] = useState<number>(globalDealFloor);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<'title' | 'price' | 'savings'>('savings');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // --- NEW: Custom glass dropdown open/close state ---
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const discountOptions = [
    { value: 0, label: 'All Offsets' },
    { value: 50, label: '50% Off+' },
    { value: 75, label: '75% Off+' },
    { value: 90, label: '90% Off+' },
  ];

  const sortOptions = [
    { value: 'savings-desc', label: 'Deal Score (High to Low)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
    { value: 'title-asc', label: 'Title (A-Z)' },
  ];

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => { setToastMessage(null); }, 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1,11&upperPrice=25')
      .then(res => res.json())
      .then(data => { setDeals(data); setLoading(false); });
  }, []);

  useEffect(() => {
    localStorage.setItem('appleWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    setMinDiscount(globalDealFloor);
  }, [globalDealFloor]);

  // --- NEW: Close custom dropdowns when clicking outside of them ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: emailInput, password: passwordInput });
        if (error) throw error;
        showToast(`✅ Account registered successfully!`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
        if (error) throw error;
        showToast(`✅ Secure connection established.`);
      }
    } catch (error: any) {
      console.error("Authentication Error:", error);
      showToast(`❌ Error: ${error.message || "Network connection failed"}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsSettingsOpen(false);
    showToast(`🔒 Session terminated securely.`);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (error) { console.error("Search failed", error); }
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCardClick = async (gameID: string) => {
    setIsModalOpen(true); setSelectedGame(null);
    try {
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
      const data = await res.json();
      setSelectedGame({ ...data, internalGameID: gameID });
    } catch (error) { console.error("Failed to load game data"); }
  };

  const addToWatchlist = (id: string, title: string, price: number) => {
    if (!id) return;
    setWatchlist(prev => {
      if (!prev.find(item => item.id === id)) {
        showToast(`✅ ${title} locked to matrix.`);
        return [...prev, { id, title, targetPrice: price }];
      }
      showToast(`⚠️ ${title} is already being tracked.`);
      return prev;
    });
    setIsModalOpen(false);
  };

  // --- NEW: Safe Deletion Logic ---
  const removeFromWatchlist = (id: string) => {
    if (safeDelete && pendingDeleteId !== id) {
      setPendingDeleteId(id);
      showToast(`⚠️ Safe Mode: Click delete again to confirm row removal.`);
      
      // Auto-reset the pending delete status after 4 seconds
      setTimeout(() => {
        setPendingDeleteId(null);
      }, 4000);
      return;
    }

    setWatchlist(prev => {
      const game = prev.find(item => item.id === id);
      if (game) showToast(`🗑️ ${game.title} removed from matrix.`);
      return prev.filter(item => item.id !== id);
    });
    setPendingDeleteId(null);
  };

  const exportWatchlistToCSV = () => {
    const headers = "Asset Identifier,Target Threshold,Currency\n";
    const rows = watchlist.map(item => `"${item.title}",${item.targetPrice},${currency}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'telemetry-matrix-export.csv');
    a.click();
    showToast(`📊 Raw data exported for tabular analysis.`);
  };

  const getDealTier = (savingsPercent: number) => {
    if (savingsPercent >= 85) return { label: 'S-TIER', color: 'bg-linear-to-r from-orange-500 to-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border-transparent', icon: <Flame size={10} className="mr-1 inline" /> };
    if (savingsPercent >= 70) return { label: 'A-TIER', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: null };
    if (savingsPercent >= 50) return { label: 'B-TIER', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: null };
    return { label: 'C-TIER', color: 'bg-white/5 text-gray-400 border-white/10', icon: null };
  };

  const handleSort = (column: 'title' | 'price' | 'savings') => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection(column === 'title' || column === 'price' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ column }: { column: 'title' | 'price' | 'savings' }) => {
    if (sortBy !== column) return <ArrowUpDown size={12} className="inline ml-1 opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' ? <ChevronUp size={12} className="inline ml-1 text-blue-400" /> : <ChevronDown size={12} className="inline ml-1 text-blue-400" />;
  };

  const filteredDeals = deals.filter(deal => Math.round(Number(deal.savings)) >= minDiscount);
  
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === 'title') return sortDirection === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
    if (sortBy === 'price') return sortDirection === 'asc' ? parseFloat(a.salePrice) - parseFloat(b.salePrice) : parseFloat(b.salePrice) - parseFloat(a.salePrice);
    return sortDirection === 'asc' ? parseFloat(a.savings) - parseFloat(b.savings) : parseFloat(b.savings) - parseFloat(a.savings);
  });

  const sortedSearchResults = [...searchResults].sort((a, b) => {
    if (sortBy === 'title') return sortDirection === 'asc' ? a.external.localeCompare(b.external) : b.external.localeCompare(a.external);
    if (sortBy === 'price') return sortDirection === 'asc' ? parseFloat(a.cheapest) - parseFloat(b.cheapest) : parseFloat(b.cheapest) - parseFloat(a.cheapest);
    return 0;
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#f5f5f7] font-sans antialiased flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[20%] left-[15%] w-[40vw] h-[40vw] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '6s' }}></div>
          <div className="absolute bottom-[20%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-purple-600/10 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-md p-8 bg-[#161617]/60 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-700">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner">
            <Lock className="text-blue-400" size={20} />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">{isSignUp ? 'Create Operator Account' : 'Terminal Access'}</h1>
            <p className="text-sm text-gray-400">{isSignUp ? 'Register credentials with Supabase DB' : 'Initialize secure connection to database.'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-2">Email Address</label>
              <input type="email" required placeholder="operator@domain.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono transition-all" />
            </div>
            <div className="space-y-1 pb-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-2">Password</label>
              <input type="password" required placeholder="••••••••" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono tracking-widest transition-all" />
            </div>
            
            <button type="submit" disabled={isAuthenticating} className="w-full bg-white text-black py-3.5 rounded-xl font-medium text-sm hover:bg-gray-200 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2">
              {isAuthenticating ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> Processing...</>
              ) : (
                <>{isSignUp ? 'Register Account' : 'Establish Connection'}</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-gray-400 hover:text-white transition-colors">
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono">
            <ShieldCheck size={12} className="text-emerald-500" /> Supabase Auth Security Active
          </div>
        </div>
      </div>
    );
  }

  // --- Dynamic Table Styling Classes based on user settings ---
  const tableClasses = `w-full text-left border-collapse ${autoFitColumns ? 'table-auto' : 'table-fixed'}`;
  const cellClasses = `p-4 font-sans ${showGridlines ? 'border border-white/10' : ''} ${autoFitColumns ? 'whitespace-nowrap' : ''}`;
  const headerClasses = `p-5 text-[11px] uppercase tracking-wider text-gray-400 font-medium select-none bg-black/20 ${showGridlines ? 'border border-white/10' : 'border-b border-white/8'}`;

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] font-sans antialiased selection:bg-white/30 relative overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/15 blur-[160px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/15 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }}></div>
      </div>

      <Navbar currency={currency} setCurrency={setCurrency} watchlistCount={watchlist.length} onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-24">
        
        <div className="text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-block text-[11px] font-semibold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 rounded-full mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            Next-Gen Telemetry Core
          </div>
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tight mb-6 text-white leading-[1.05]">
            Profound savings. <br />
            <span className="bg-linear-to-r from-gray-100 via-gray-400 to-gray-600 bg-clip-text text-transparent">
              Engineered for players.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 tracking-tight font-normal max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time multi-store telemetry, deep historical volatility metrics, and instant tracking alerts in an ultra-refined interface.
          </p>

          <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-white" size={20} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Search database (e.g. Cyberpunk, God of War)..."
              className="w-full bg-[#161617]/80 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-14 pr-28 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all placeholder:text-gray-600 shadow-2xl font-mono"
            />
            {searchQuery && (
               <button type="button" onClick={clearSearch} className="absolute right-22 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                 <X size={16} />
               </button>
            )}
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black px-5 py-2 rounded-full font-medium text-xs hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-md">
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-white/8 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 relative" ref={filterMenuRef}>
              <Filter size={15} className="text-gray-400" />
              <button
                type="button"
                onClick={() => { setFilterMenuOpen(o => !o); setSortMenuOpen(false); }}
                className={`flex items-center justify-between gap-3 min-w-[140px] bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border rounded-lg py-1.5 px-3 text-xs text-gray-100 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] ${filterMenuOpen ? 'border-white/40 bg-white/15' : 'border-white/15 hover:bg-white/15 hover:border-white/30'}`}
              >
                {discountOptions.find(o => o.value === minDiscount)?.label}
                <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${filterMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {filterMenuOpen && (
                <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border border-white/15 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 origin-top p-1.5">
                  {discountOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setMinDiscount(opt.value); setFilterMenuOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-colors ${minDiscount === opt.value ? 'bg-blue-500/25 text-blue-300 font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 border-l border-white/10 pl-4 relative" ref={sortMenuRef}>
              <ArrowUpDown size={15} className="text-gray-400" />
              <button
                type="button"
                onClick={() => { setSortMenuOpen(o => !o); setFilterMenuOpen(false); }}
                className={`flex items-center justify-between gap-3 min-w-[200px] bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border rounded-lg py-1.5 px-3 text-xs text-gray-100 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] ${sortMenuOpen ? 'border-white/40 bg-white/15' : 'border-white/15 hover:bg-white/15 hover:border-white/30'}`}
              >
                {sortOptions.find(o => o.value === `${sortBy}-${sortDirection}`)?.label}
                <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${sortMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortMenuOpen && (
                <div className="absolute top-full left-0 mt-2 min-w-[210px] bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border border-white/15 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 origin-top p-1.5">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const [newSort, newDir] = opt.value.split('-');
                        setSortBy(newSort as any);
                        setSortDirection(newDir as any);
                        setSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-colors ${`${sortBy}-${sortDirection}` === opt.value ? 'bg-blue-500/25 text-blue-300 font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex bg-[#161617]/80 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${viewMode === 'grid' ? 'bg-white/15 text-white shadow-md scale-105' : 'text-gray-400 hover:text-white'}`} >
              <LayoutGrid size={14} /> Grid View
            </button>
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${viewMode === 'table' ? 'bg-white/15 text-white shadow-md scale-105' : 'text-gray-400 hover:text-white'}`} >
              <TableProperties size={14} /> Matrix View
            </button>
          </div>
        </div>

        <div className="mb-24 transition-all duration-500 ease-in-out">
          {(loading || isSearching) ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
               {[...Array(8)].map((_, i) => (
                 <div key={i} className="bg-white/5 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 rounded-3xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
                   <div className="flex flex-col gap-3">
                     <div className="rounded-2xl bg-white/5 aspect-video w-full"></div>
                     <div className="h-4 bg-white/10 rounded-full w-3/4 mt-1"></div>
                     <div className="flex justify-between items-center mt-2">
                       <div className="h-4 bg-white/10 rounded-full w-1/4"></div>
                       <div className="h-3 bg-white/5 rounded-full w-1/5"></div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <>
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                  {searchQuery && searchResults.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                      <SearchX size={48} className="text-gray-600 mb-5 animate-bounce" />
                      <h3 className="text-gray-300 font-medium mb-2 text-lg">No telemetry found for "{searchQuery}"</h3>
                      <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">Adjust your parameters and initialize a new scan to discover deals.</p>
                      <button onClick={clearSearch} className="bg-white/10 hover:bg-white text-white hover:text-black px-6 py-2.5 rounded-full text-xs font-semibold transition-all shadow-md">Clear Search Parameters</button>
                    </div>
                  ) : searchQuery && searchResults.length > 0 ? (
                    sortedSearchResults.slice(0, 12).map((game) => (
                      <div key={game.gameID} onClick={() => handleCardClick(game.gameID)} className="group cursor-pointer bg-white/5 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 rounded-3xl p-4 hover:border-white/25 transition-all duration-500 hover:bg-white/10 hover:-translate-y-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)]">
                        <div className="rounded-2xl overflow-hidden aspect-video relative mb-4 bg-black/40">
                          <img src={getHighResImage(game.thumb)} onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== game.thumb) img.src = game.thumb; }} alt={game.external} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                        </div>
                        <h3 className="font-medium text-sm tracking-tight truncate text-white/90 group-hover:text-white mb-1">{game.external}</h3>
                        <p className="text-gray-400 text-xs">Historical Low: <span className="text-white font-medium font-mono">{formatPrice(game.cheapest, currency)}</span></p>
                      </div>
                    ))
                  ) : (
                    sortedDeals.slice(0, 12).map((deal) => {
                      const savingsNum = Math.round(Number(deal.savings));
                      const tier = getDealTier(savingsNum);
                      return (
                        <div key={deal.gameID} onClick={() => handleCardClick(deal.gameID)} className="group cursor-pointer bg-white/5 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 rounded-3xl p-4 transition-all duration-500 hover:border-white/25 hover:bg-white/10 hover:-translate-y-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] transform">
                          <div className="rounded-2xl overflow-hidden aspect-video relative mb-4 bg-black/40">
                            <img src={getHighResImage(deal.thumb)} onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== deal.thumb) img.src = deal.thumb; }} alt={deal.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                            
                            <div className="absolute top-2 left-2 flex gap-1">
                              <div className={`font-bold text-[9px] px-2 py-1 rounded-md border ${tier.color} backdrop-blur-md flex items-center shadow-md`}>
                                {tier.icon} {tier.label}
                              </div>
                            </div>
                            
                            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-white/10 text-white font-semibold font-mono text-[10px] px-2 py-1 rounded-md shadow-md">
                              -{savingsNum}%
                            </div>
                          </div>
                          <h3 className="font-medium text-sm tracking-tight truncate text-white/90 group-hover:text-white mb-2">{deal.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-semibold font-mono">{formatPrice(deal.salePrice, currency)}</span>
                            <span className="text-gray-600 line-through text-xs font-mono">{formatPrice(deal.normalPrice, currency)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {viewMode === 'table' && (
                <div className={`bg-white/5 border border-white/10 rounded-3xl overflow-x-auto backdrop-blur-2xl backdrop-saturate-150 shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] animate-in fade-in duration-500`}>
                  <table className={tableClasses}>
                    <thead>
                      <tr>
                        <th className={`${headerClasses} cursor-pointer hover:text-white transition-colors group`} onClick={() => handleSort('title')}>
                          Asset Identifier <SortIcon column="title" />
                        </th>
                        <th className={`${headerClasses} hidden md:table-cell`}>Standard MSRP</th>
                        <th className={`${headerClasses} cursor-pointer hover:text-white transition-colors group`} onClick={() => handleSort('price')}>
                          Live Acquisition <SortIcon column="price" />
                        </th>
                        <th className={`${headerClasses} cursor-pointer hover:text-white transition-colors group`} onClick={() => handleSort('savings')}>
                          Deal Score <SortIcon column="savings" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`text-sm font-mono ${!showGridlines ? 'divide-y divide-white/4' : ''}`}>
                      {searchQuery && searchResults.length === 0 ? (
                         <tr>
                           <td colSpan={4} className={`${cellClasses} py-16 text-center text-gray-500 bg-black/20 font-sans`}>
                             <SearchX size={32} className="mx-auto text-gray-600 mb-3 animate-bounce" />
                             Matrix yielded no results. Try adjusting the query string.
                           </td>
                         </tr>
                      ) : searchQuery && searchResults.length > 0 ? (
                        sortedSearchResults.map((game) => (
                          <tr key={game.gameID} onClick={() => handleCardClick(game.gameID)} className="hover:bg-white/6 cursor-pointer transition-colors duration-200 group">
                            <td className={`${cellClasses} flex items-center gap-4 font-sans`}>
                              <img src={getHighResImage(game.thumb)} onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== game.thumb) img.src = game.thumb; }} alt="thumb" className="w-16 h-8 rounded-md object-cover border border-white/10 group-hover:scale-105 transition-transform shadow-md" />
                              <span className="font-medium text-white/90 group-hover:text-white">{game.external}</span>
                            </td>
                            <td className={`${cellClasses} text-gray-600 hidden md:table-cell`}>--</td>
                            <td className={`${cellClasses} font-semibold text-white`}>{formatPrice(game.cheapest, currency)} <span className="text-xs text-gray-500 font-normal font-sans ml-1">Floor</span></td>
                            <td className={`${cellClasses} text-gray-600 text-xs font-sans`}>Search Data</td>
                          </tr>
                        ))
                      ) : (
                        sortedDeals.map((deal) => {
                          const savingsNum = Math.round(Number(deal.savings));
                          const tier = getDealTier(savingsNum);
                          return (
                            <tr key={deal.gameID} onClick={() => handleCardClick(deal.gameID)} className="hover:bg-white/6 cursor-pointer transition-colors duration-200 group">
                              <td className={`${cellClasses} flex items-center gap-4 font-sans`}>
                                <img src={getHighResImage(deal.thumb)} onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== deal.thumb) img.src = deal.thumb; }} alt="thumb" className="w-16 h-8 rounded-md object-cover border border-white/10 group-hover:scale-105 transition-transform shadow-md" />
                                <span className="font-medium text-white/90 group-hover:text-white truncate">{deal.title}</span>
                              </td>
                              <td className={`${cellClasses} text-gray-500 line-through hidden md:table-cell text-xs`}>{formatPrice(deal.normalPrice, currency)}</td>
                              <td className={`${cellClasses} font-semibold text-emerald-400`}>{formatPrice(deal.salePrice, currency)}</td>
                              <td className={`${cellClasses} flex items-center gap-3 font-sans`}>
                                <span className={`font-bold text-[9px] px-2 py-1 rounded-md border ${tier.color}`}>
                                  {tier.label}
                                </span>
                                <span className="text-gray-400 font-medium text-xs font-mono">
                                  -{savingsNum}%
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_30px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] animate-in fade-in duration-700 mt-10">
          <div className="flex justify-between items-center mb-8 border-b border-white/8 pb-5">
            <div className="flex items-center gap-3">
              <Bookmark className="text-white" size={18} />
              <h2 className="text-xl font-semibold tracking-tight text-white">Active Watchlist Matrix.</h2>
            </div>
            {watchlist.length > 0 && (
              <button 
                onClick={exportWatchlistToCSV}
                className="flex items-center gap-2 bg-white/10 hover:bg-white hover:text-black text-white px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 shadow-sm"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
          
          {watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                <Bookmark className="text-gray-500" size={24} />
              </div>
              <h3 className="text-gray-300 font-medium mb-1 text-base">Matrix is currently empty</h3>
              <p className="text-gray-500 text-xs max-w-sm leading-relaxed">Search the database and select a target price to begin tracking automated market telemetry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.map(game => (
                <div key={game.id} className={`group flex justify-between items-center bg-white/5 backdrop-blur-xl backdrop-saturate-150 border ${pendingDeleteId === game.id ? 'border-red-500 bg-red-500/10 scale-[0.98]' : 'border-white/10 hover:border-white/25 hover:bg-white/10 hover:-translate-y-1'} p-4 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]`}>
                  <div>
                    <h4 className="font-medium text-xs tracking-tight text-white/90 truncate max-w-45 mb-1">{game.title}</h4>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                      <Bell size={10} className="text-blue-400" /> Target: {formatPrice(game.targetPrice, currency)}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFromWatchlist(game.id); }} 
                    className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${pendingDeleteId === game.id ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100'}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- UPGRADED ADVANCED SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl transition-opacity animate-in fade-in duration-300" onClick={() => setIsSettingsOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-[#1c1c1e] border border-white/15 rounded-[2rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.1)] animate-in fade-in zoom-in-95 duration-300 flex flex-col text-white">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#161617]/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Settings size={16} className="text-blue-400" />
                </div>
                <h3 className="font-semibold tracking-tight text-lg">System Preferences</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 transition-colors text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex border-b border-white/5 bg-[#111]">
              <button onClick={() => setSettingsTab('data')} className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${settingsTab === 'data' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>Grid & Matrix Controls</button>
              <button onClick={() => setSettingsTab('global')} className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${settingsTab === 'global' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>Global Thresholds</button>
              <button onClick={() => setSettingsTab('account')} className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${settingsTab === 'account' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>Account & Security</button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {settingsTab === 'data' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Toggle: Printable Gridlines */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><Grid3X3 size={16} className="text-blue-400"/> Printable Gridlines</h4>
                        <p className="text-xs text-gray-400 mb-4">Enforce hard structural borders within the matrix for easier data isolation and standard spreadsheet parsing.</p>
                      </div>
                      <button 
                        onClick={() => setShowGridlines(!showGridlines)}
                        className={`w-full py-2 rounded-xl text-xs font-medium transition-all border ${showGridlines ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                      >
                        {showGridlines ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {/* Toggle: Auto-fit Columns */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><Columns size={16} className="text-emerald-400"/> Auto-fit Column Widths</h4>
                        <p className="text-xs text-gray-400 mb-4">Compress data arrays to wrap tightly around asset identifiers and numerical values automatically.</p>
                      </div>
                      <button 
                        onClick={() => setAutoFitColumns(!autoFitColumns)}
                        className={`w-full py-2 rounded-xl text-xs font-medium transition-all border ${autoFitColumns ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                      >
                        {autoFitColumns ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {/* Toggle: Safe Mode Deletion */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:col-span-2 flex justify-between items-center">
                      <div className="pr-8">
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><ShieldAlert size={16} className="text-amber-400"/> Safe Mode: Row Management</h4>
                        <p className="text-xs text-gray-400">Require double-verification when removing assets from the active matrix to prevent accidental data loss.</p>
                      </div>
                      <button 
                        onClick={() => setSafeDelete(!safeDelete)}
                        className={`px-6 py-2 rounded-xl text-xs font-medium transition-all border whitespace-nowrap ${safeDelete ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                      >
                        {safeDelete ? 'Active' : 'Bypassed'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-6">
                    <button onClick={exportWatchlistToCSV} className="w-full bg-white/10 hover:bg-white text-white hover:text-black py-3 rounded-xl text-sm font-medium transition-all shadow-md flex items-center justify-center gap-2">
                      <Download size={16} /> Compile CSV Data Export
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'global' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                     <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><Percent size={16} className="text-blue-400"/> Global Deal Floor</h4>
                     <p className="text-xs text-gray-400 mb-4">Establish a strict baseline threshold. Telemetry below this margin will be permanently filtered from the dashboard until modified.</p>
                     
                     <div className="flex gap-2">
                       {[0, 50, 75, 90].map(val => (
                         <button 
                           key={val}
                           onClick={() => setGlobalDealFloor(val)}
                           className={`flex-1 py-2.5 rounded-xl font-mono text-sm transition-all border ${globalDealFloor === val ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#111] border-white/10 text-gray-400 hover:border-white/30'}`}
                         >
                           {val === 0 ? '0%' : `+${val}%`}
                         </button>
                       ))}
                     </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                     <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><Coins size={16} className="text-emerald-400"/> Fiat Currency Locking</h4>
                     <p className="text-xs text-gray-400 mb-4">Hard-lock the conversion rates across all pricing telemetry.</p>
                     
                     <div className="flex gap-2">
                       {['USD', 'EUR', 'GBP'].map(curr => (
                         <button 
                           key={curr}
                           onClick={() => setCurrency(curr)}
                           className={`flex-1 py-2.5 rounded-xl font-mono text-sm transition-all border ${currency === curr ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#111] border-white/10 text-gray-400 hover:border-white/30'}`}
                         >
                           {curr}
                         </button>
                       ))}
                     </div>
                  </div>
                </div>
              )}

              {settingsTab === 'account' && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                 <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white/10 shadow-lg flex items-center justify-center">
                     <User size={32} className="text-white" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-lg">Authenticated Operator</h4>
                     <p className="text-gray-400 text-sm font-mono">{session.user.email}</p>
                   </div>
                 </div>
                 
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> Supabase Auth Active</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Session managed securely through PostgreSQL token handshakes. 
                    </p>
                    <div className="text-[10px] font-mono text-emerald-500/70 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">STATUS: VERIFIED SESSION</div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => { setWatchlist([]); showToast('🗑️ Matrix fully wiped.'); setIsSettingsOpen(false); }} className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 hover:text-amber-300 py-3 rounded-xl font-medium text-sm transition-all shadow-md">
                     Wipe Local Data
                   </button>
                   <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white py-3 rounded-xl font-medium text-sm transition-all shadow-md">
                     <LogOut size={16} /> Terminate
                   </button>
                 </div>
               </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl transition-opacity animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-4xl bg-[#1c1c1e] border-t md:border border-white/15 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.1)] animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95 max-h-[85vh] md:max-h-[90vh] flex flex-col text-white">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white shadow-md">
              <X size={16} />
            </button>
            
            <div className="p-6 md:p-12 overflow-y-auto">
              {!selectedGame ? (
                <div className="flex justify-center py-24">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 shadow-inner"></div>
                    <div className="h-4 bg-white/5 rounded-full w-32 shadow-inner"></div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-10">
                  
                  <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-6">
                    <img 
                      src={getHighResImage(selectedGame.info.thumb)} 
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src !== selectedGame.info.thumb) img.src = selectedGame.info.thumb;
                      }}
                      alt="Cover" 
                      className="w-full rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/10" 
                    />
                    
                    <div className="bg-black/60 border border-white/10 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 flex items-center gap-1.5"><Bell size={14}/> Threshold Alert</h4>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">{CURRENCY_RATES[currency].symbol}</span>
                          <input 
                            type="number" 
                            id="custom-target-price"
                            defaultValue={Math.floor(selectedGame.cheapestPriceEver.price)}
                            className="w-full bg-[#111] border border-white/10 rounded-xl py-2 pl-7 pr-3 text-sm text-white focus:outline-none focus:border-white/40 font-mono shadow-inner transition-colors"
                            min="0" step="0.5"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('custom-target-price') as HTMLInputElement).value;
                            addToWatchlist(selectedGame.internalGameID, selectedGame.info.title, parseFloat(val));
                          }}
                          className="bg-white text-black px-4 rounded-xl font-medium text-xs hover:bg-gray-200 active:scale-95 transition-all shadow-md"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h2 className="text-3xl font-semibold tracking-tight mb-3 text-white">{selectedGame.info.title}</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/4 border border-white/10 rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">Historical Low</span>
                        <span className="text-2xl font-semibold text-emerald-400 font-mono">{formatPrice(selectedGame.cheapestPriceEver.price, currency)}</span>
                      </div>
                      <div className="bg-white/4 border border-white/10 rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">Recorded Date</span>
                        <span className="text-base font-medium text-gray-200 font-mono">{new Date(selectedGame.cheapestPriceEver.date * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-white/4 border border-white/10 rounded-2xl p-4 mb-6 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-blue-400" /> 30-Day Volatility Trend
                        </span>
                      </div>
                      
                      <InteractiveChart 
                        lowest={selectedGame.cheapestPriceEver.price} 
                        current={selectedGame.deals?.[0]?.price || selectedGame.cheapestPriceEver.price} 
                        normal={selectedGame.deals?.[0]?.retailPrice || 60} 
                        currencySymbol={CURRENCY_RATES[currency].symbol} 
                      />

                    </div>
                    
                    <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-400 mb-3">Storefront Matrix</h3>
                    
                    <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 max-h-40">
                      {selectedGame.deals && selectedGame.deals.length > 0 ? (
                        selectedGame.deals.map((deal: any) => (
                          <div 
                            key={deal.dealID} 
                            className="flex items-center justify-between bg-black/40 border border-white/6 rounded-xl p-3.5 hover:bg-white/10 transition-colors shadow-sm"
                          >
                            <div>
                              <div className="font-medium text-xs text-white">{STORE_MAP[deal.storeID] || `Store #${deal.storeID}`}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 font-mono">
                                <span className="text-emerald-400 font-semibold">{formatPrice(deal.price, currency)}</span>
                                <span className="line-through text-gray-600">{formatPrice(deal.retailPrice, currency)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-white/10 text-white font-medium font-mono text-[10px] px-2 py-0.5 rounded-full shadow-inner border border-white/5">
                                -{Math.round(Number(deal.savings))}%
                              </span>
                              <a 
                                href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-white text-black hover:bg-gray-200 p-1.5 px-3 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-1 text-xs font-medium shadow-md"
                              >
                                View <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 font-mono">No active network deals available.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div 
        className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 transform ${
          toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 text-white shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] px-5 py-3 rounded-2xl font-medium text-sm flex items-center gap-3 font-mono">
          {toastMessage}
        </div>
      </div>

    </div>
  );
}