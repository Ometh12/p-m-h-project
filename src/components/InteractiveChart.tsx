import { useState, useMemo, useRef, type MouseEvent } from 'react';
interface ChartProps {
  lowest: string | number;
  current: string | number;
  normal: string | number;
  currencySymbol: string;
}

export default function InteractiveChart({ lowest, current, normal, currencySymbol }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Generate 30 days of realistic market data based on the API pricing
  const data = useMemo(() => {
    const points = [];
    const min = parseFloat(lowest as string) || 0;
    const max = parseFloat(normal as string) || 60;
    const curr = parseFloat(current as string) || min;

    let currentVal = max;
    for (let i = 0; i < 30; i++) {
      if (i === 29) {
        currentVal = curr; 
      } else if (i === 15) {
        currentVal = min; 
      } else {
        const variance = (max - min) * 0.15;
        currentVal = Math.max(min, Math.min(max, currentVal + (Math.random() * variance * 2 - variance) - (max - min) * 0.02));
      }
      
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      points.push({
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        price: currentVal
      });
    }
    return points;
  }, [lowest, current, normal]);

  // SVG Canvas Math
  const width = 800;
  const height = 200;
  const paddingX = 0;
  const paddingY = 20;

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice || 1;

  const getX = (index: number) => paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  const getY = (price: number) => height - paddingY - ((price - minPrice) / priceRange) * (height - paddingY * 2);

  const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.price)}`).join(' ');
  const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  // Crosshair Logic
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
  };

  return (
    <div 
      className="relative w-full h-[180px] mt-4 mb-2 group" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Filled Area */}
        <path d={areaPath} fill="url(#chartGradient)" />
        
        {/* Main Line */}
        <path d={pathData} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive Crosshair */}
        {hoverIndex !== null && (
          <>
            <line 
              x1={getX(hoverIndex)} y1={0} 
              x2={getX(hoverIndex)} y2={height} 
              stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.3" 
            />
            <circle 
              cx={getX(hoverIndex)} cy={getY(data[hoverIndex].price)} 
              r="5" fill="#111" stroke="#34d399" strokeWidth="2" 
              className="transition-all duration-75"
            />
          </>
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoverIndex !== null && (
        <div 
          className="absolute top-[-30px] pointer-events-none bg-white text-black font-semibold text-xs px-3 py-1.5 rounded-lg shadow-[0_5px_20px_rgba(0,0,0,0.5)] transform -translate-x-1/2 transition-all duration-75 flex flex-col items-center"
          style={{ left: `${(hoverIndex / (data.length - 1)) * 100}%` }}
        >
          <span className="text-[9px] text-gray-500 uppercase tracking-wider">{data[hoverIndex].date}</span>
          <span>{currencySymbol}{data[hoverIndex].price.toFixed(2)}</span>
          <div className="absolute bottom-[-4px] w-2 h-2 bg-white rotate-45"></div>
        </div>
      )}
    </div>
  );
}