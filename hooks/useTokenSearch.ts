// hooks/useTokenSearch.ts
import { useState } from 'react';

export const useTokenSearch = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchTokenData = async (tokenSymbol: string) => {
    setLoading(true);
    try {
      // Kita cari pair token di DexScreener
      const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${tokenSymbol}`);
      const json = await res.json();
      if (json.pairs && json.pairs.length > 0) {
        // Ambil hasil pertama yang paling relevan
        setData(json.pairs[0]);
      }
    } catch (e) {
      console.error("Gagal ambil data:", e);
    }
    setLoading(false);
  };

  return { data, loading, fetchTokenData };
};