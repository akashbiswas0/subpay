"use client";

import { useEffect, useState } from "react";
import { getDotPrices, type DotPrices } from "@/utils/coingecko";

export function usePrices() {
  const [prices, setPrices] = useState<DotPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPrices = async () => {
      try {
        const nextPrices = await getDotPrices();
        if (!mounted) return;
        setPrices(nextPrices);
        setError(null);
      } catch {
        if (!mounted) return;
        setError("Failed to fetch prices");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPrices();
    const intervalId = window.setInterval(loadPrices, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return { prices, loading, error };
}
