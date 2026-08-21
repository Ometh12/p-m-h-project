export const STORE_MAP: Record<string, string> = {
  "1": "Steam", "2": "GamersGate", "3": "GreenManGaming", "4": "Amazon",
  "7": "GOG", "8": "Origin", "11": "Humble Store", "13": "Uplay",
  "15": "Fanatical", "21": "WinGameStore", "23": "GameBillet", "24": "Voidu",
  "25": "Epic Games", "27": "Gamesplanet", "29": "2Game", "30": "IndieGala",
  "31": "Blizzard Shop", "33": "DLGamer", "35": "DreamGame"
};

export const CURRENCY_RATES: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1.0 },
  EUR: { symbol: "€", rate: 0.92 },
  GBP: { symbol: "£", rate: 0.78 },
  AUD: { symbol: "A$", rate: 1.52 }
};

export const getHighResImage = (url: string) => {
  if (!url) return '';
  if (url.includes('steamstatic') || url.includes('akamaihd')) {
    const parts = url.split('/');
    parts[parts.length - 1] = 'header.jpg';
    return parts.join('/');
  }
  return url;
};

export const formatPrice = (priceStr: string | number, currency: string) => {
  const num = typeof priceStr === 'string' ? parseFloat(priceStr) : priceStr;
  const curr = CURRENCY_RATES[currency];
  return `${curr.symbol}${(num * curr.rate).toFixed(2)}`;
};