import { useState, useEffect } from 'react';
import { Search, Bookmark, X, Bell, ExternalLink, LayoutGrid, TableProperties, Filter, Download, TrendingUp, Flame, SearchX, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { STORE_MAP, formatPrice, getHighResImage, CURRENCY_RATES } from './utils';
import Navbar from './components/Navbar';
import InteractiveChart from './components/InteractiveChart';

interface Deal { gameID: string; title: string; salePrice: string; normalPrice: string; savings: string; thumb: string; }
interface SearchResult { gameID: string; external: string; cheapest: string; thumb: string; }
interface WatchlistItem { id: string; title: string; targetPrice: number; }

export default function App() {
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('USD');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<'title' | 'price' | 'savings'>('savings');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => { setToastMessage(null); }, 3000);
  };

  useEffect(() => {
    fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1,11&upperPrice=25')
      .then(res => res.json())
      .then(data => { setDeals(data); setLoading(false); });
  }, []);

  useEffect(() => {
    localStorage.setItem('appleWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

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

  const removeFromWatchlist = (id: string) => {
    setWatchlist(prev => {
      const game = prev.find(item => item.id === id);
      if (game) showToast(`🗑️ ${game.title} removed from matrix.`);
      return prev.filter(item => item.id !== id);
    });
  };

  const exportWatchlistToCSV = () => {
    const headers = "Game Title,Target Price\n";
    const rows = watchlist.map(item => `"${item.title}",${item.targetPrice}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'gametracker-watchlist.csv');
    a.click();
    showToast(`📊 Matrix exported successfully.`);
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

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] font-sans antialiased selection:bg-white/30 relative overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/15 blur-[160px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/15 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }}></div>
      </div>

      <Navbar currency={currency} setCurrency={setCurrency} watchlistCount={watchlist.length} />

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
              className="w-full bg-[#161617]/80 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-14 pr-28 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all placeholder:text-gray-600 shadow-2xl"
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
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-gray-400" />
              <select 
                className="bg-[#161617] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-gray-200 focus:outline-none transition-colors hover:border-white/30 cursor-pointer"
                value={minDiscount}
                onChange={(e) => setMinDiscount(Number(e.target.value))}
              >
                <option value={0}>All Offsets</option>
                <option value={50}>50% Off+</option>
                <option value={75}>75% Off+</option>
                <option value={90}>90% Off+</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <ArrowUpDown size={15} className="text-gray-400" />
              <select 
                className="bg-[#161617] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-gray-200 focus:outline-none transition-colors hover:border-white/30 cursor-pointer"
                value={`${sortBy}-${sortDirection}`}
                onChange={(e) => {
                  const [newSort, newDir] = e.target.value.split('-');
                  setSortBy(newSort as any);
                  setSortDirection(newDir as any);
                }}
              >
                <option value="savings-desc">Deal Score (High to Low)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="title-asc">Title (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="flex bg-[#161617]/80 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-inner">
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
                 <div key={i} className="bg-[#161617]/40 border border-white/4 rounded-3xl p-4">
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
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-[#161617]/40 border border-white/4 rounded-3xl backdrop-blur-md">
                      <SearchX size={48} className="text-gray-600 mb-5 animate-bounce" />
                      <h3 className="text-gray-300 font-medium mb-2 text-lg">No telemetry found for "{searchQuery}"</h3>
                      <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">Adjust your parameters and initialize a new scan to discover deals.</p>
                      <button onClick={clearSearch} className="bg-white/10 hover:bg-white text-white hover:text-black px-6 py-2.5 rounded-full text-xs font-semibold transition-all shadow-md">Clear Search Parameters</button>
                    </div>
                  ) : searchQuery && searchResults.length > 0 ? (
                    sortedSearchResults.slice(0, 12).map((game) => (
                      <div key={game.gameID} onClick={() => handleCardClick(game.gameID)} className="group cursor-pointer bg-[#161617]/40 backdrop-blur-md border border-white/8 rounded-3xl p-4 hover:border-white/30 transition-all duration-500 hover:bg-[#161617] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                        <div className="rounded-2xl overflow-hidden aspect-video relative mb-4 bg-black/40">
                          <img src={getHighResImage(game.thumb)} onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== game.thumb) img.src = game.thumb; }} alt={game.external} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                        </div>
                        <h3 className="font-medium text-sm tracking-tight truncate text-white/90 group-hover:text-white mb-1">{game.external}</h3>
                        <p className="text-gray-400 text-xs">Historical Low: <span className="text-white font-medium">{formatPrice(game.cheapest, currency)}</span></p>
                      </div>
                    ))
                  ) : (
                    sortedDeals.slice(0, 12).map((deal) => {
                      const savingsNum = Math.round(Number(deal.savings));
                      const tier = getDealTier(savingsNum);
                      return (
                        <div key={deal.gameID} onClick={() => handleCardClick(deal.gameID)} className="group cursor-pointer bg-[#161617]/40 backdrop-blur-md border border-white/8 rounded-3xl p-4 hover:border-white/30 hover:bg-[#161617] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-transform">
                          <div className="rounded-2xl overflow-hidden aspect-video relative mb-4 bg-black/40">
                            <img src={getHighResImage(deal.thumb)} onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== deal.thumb) img.src = deal.thumb; }} alt={deal.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                            
                            <div className="absolute top-2 left-2 flex gap-1">
                              <div className={`font-bold text-[9px] px-2 py-1 rounded-md border ${tier.color} backdrop-blur-md flex items-center`}>
                                {tier.icon} {tier.label}
                              </div>
                            </div>
                            
                            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-white/10 text-white font-semibold text-[10px] px-2 py-1 rounded-md">
                              -{savingsNum}%
                            </div>
                          </div>
                          <h3 className="font-medium text-sm tracking-tight truncate text-white/90 group-hover:text-white mb-2">{deal.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-semibold">{formatPrice(deal.salePrice, currency)}</span>
                            <span className="text-gray-600 line-through text-xs">{formatPrice(deal.normalPrice, currency)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {viewMode === 'table' && (
                <div className="bg-[#161617]/60 border border-white/8 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl animate-in fade-in duration-500">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/8 text-[11px] uppercase tracking-wider text-gray-400 font-medium select-none">
                        <th className="p-5 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('title')}>
                          Asset Identifier <SortIcon column="title" />
                        </th>
                        <th className="p-5 hidden md:table-cell">Standard MSRP</th>
                        <th className="p-5 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('price')}>
                          Live Acquisition <SortIcon column="price" />
                        </th>
                        <th className="p-5 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('savings')}>
                          Deal Score <SortIcon column="savings" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/4 text-sm">
                      {searchQuery && searchResults.length === 0 ? (
                         <tr>
                           <td colSpan={4} className="py-16 text-center text-gray-500 bg-black/20">
                             <SearchX size={32} className="mx-auto text-gray-600 mb-3 animate-bounce" />
                             Matrix yielded no results. Try adjusting the query string.
                           </td>
                         </tr>
                      ) : searchQuery && searchResults.length > 0 ? (
                        sortedSearchResults.map((game) => (
                          <tr key={game.gameID} onClick={() => handleCardClick(game.gameID)} className="hover:bg-white/6 cursor-pointer transition-colors duration-200 group">
                            <td className="p-4 flex items-center gap-4">
                              <img src={getHighResImage(game.thumb)} onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== game.thumb) img.src = game.thumb; }} alt="thumb" className="w-16 h-8 rounded-md object-cover border border-white/10 group-hover:scale-105 transition-transform" />
                              <span className="font-medium text-white/90 group-hover:text-white">{game.external}</span>
                            </td>
                            <td className="p-4 text-gray-600 hidden md:table-cell">--</td>
                            <td className="p-4 font-semibold text-white">{formatPrice(game.cheapest, currency)} <span className="text-xs text-gray-500 font-normal">Floor</span></td>
                            <td className="p-4 text-gray-600 text-xs">Search Data</td>
                          </tr>
                        ))
                      ) : (
                        sortedDeals.map((deal) => {
                          const savingsNum = Math.round(Number(deal.savings));
                          const tier = getDealTier(savingsNum);
                          return (
                            <tr key={deal.gameID} onClick={() => handleCardClick(deal.gameID)} className="hover:bg-white/6 cursor-pointer transition-colors duration-200 group">
                              <td className="p-4 flex items-center gap-4">
                                <img src={getHighResImage(deal.thumb)} onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== deal.thumb) img.src = deal.thumb; }} alt="thumb" className="w-16 h-8 rounded-md object-cover border border-white/10 group-hover:scale-105 transition-transform" />
                                <span className="font-medium text-white/90 group-hover:text-white">{deal.title}</span>
                              </td>
                              <td className="p-4 text-gray-500 line-through hidden md:table-cell text-xs">{formatPrice(deal.normalPrice, currency)}</td>
                              <td className="p-4 font-semibold text-emerald-400">{formatPrice(deal.salePrice, currency)}</td>
                              <td className="p-4 flex items-center gap-3">
                                <span className={`font-bold text-[9px] px-2 py-1 rounded-md border ${tier.color}`}>
                                  {tier.label}
                                </span>
                                <span className="text-gray-400 font-medium text-xs">
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

        <div className="bg-[#161617]/40 border border-white/8 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-2xl animate-in fade-in duration-700 mt-10">
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
                <div key={game.id} className="group flex justify-between items-center bg-black/50 border border-white/6 p-4 rounded-2xl transition-all duration-300 hover:border-white/30 hover:bg-black/80 hover:-translate-y-1">
                  <div>
                    <h4 className="font-medium text-xs tracking-tight text-white/90 truncate max-w-45 mb-1">{game.title}</h4>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Bell size={10} className="text-blue-400" /> Target: {formatPrice(game.targetPrice, currency)}
                    </span>
                  </div>
                  <button onClick={() => removeFromWatchlist(game.id)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl transition-opacity animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-4xl bg-[#1c1c1e] border-t md:border border-white/15 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95 max-h-[85vh] md:max-h-[90vh] flex flex-col text-white">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white">
              <X size={16} />
            </button>
            
            <div className="p-6 md:p-12 overflow-y-auto">
              {!selectedGame ? (
                <div className="flex justify-center py-24">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10"></div>
                    <div className="h-4 bg-white/5 rounded-full w-32"></div>
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
                      className="w-full rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10" 
                    />
                    
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                      <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 flex items-center gap-1.5"><Bell size={14}/> Threshold Alert</h4>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{CURRENCY_RATES[currency].symbol}</span>
                          <input 
                            type="number" 
                            id="custom-target-price"
                            defaultValue={Math.floor(selectedGame.cheapestPriceEver.price)}
                            className="w-full bg-[#111] border border-white/10 rounded-xl py-2 pl-7 pr-3 text-sm text-white focus:outline-none focus:border-white/40"
                            min="0" step="0.5"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('custom-target-price') as HTMLInputElement).value;
                            addToWatchlist(selectedGame.internalGameID, selectedGame.info.title, parseFloat(val));
                          }}
                          className="bg-white text-black px-4 rounded-xl font-medium text-xs hover:bg-gray-200 active:scale-95 transition-all"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h2 className="text-3xl font-semibold tracking-tight mb-3 text-white">{selectedGame.info.title}</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">Historical Low</span>
                        <span className="text-2xl font-semibold text-emerald-400">{formatPrice(selectedGame.cheapestPriceEver.price, currency)}</span>
                      </div>
                      <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">Recorded Date</span>
                        <span className="text-base font-medium text-gray-200">{new Date(selectedGame.cheapestPriceEver.date * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-white/4 border border-white/10 rounded-2xl p-4 mb-6">
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
                            className="flex items-center justify-between bg-black/30 border border-white/6 rounded-xl p-3.5 hover:bg-white/6 transition-colors"
                          >
                            <div>
                              <div className="font-medium text-xs text-white">{STORE_MAP[deal.storeID] || `Store #${deal.storeID}`}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                <span className="text-emerald-400 font-semibold">{formatPrice(deal.price, currency)}</span>
                                <span className="line-through text-gray-600">{formatPrice(deal.retailPrice, currency)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-white/10 text-white font-medium text-[10px] px-2 py-0.5 rounded-full">
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
                        <p className="text-xs text-gray-500">No active network deals available.</p>
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
        className={`fixed bottom-6 right-6 z-100 transition-all duration-500 transform ${
          toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-5 py-3 rounded-2xl font-medium text-sm flex items-center gap-3">
          {toastMessage}
        </div>
      </div>

    </div>
  );
}