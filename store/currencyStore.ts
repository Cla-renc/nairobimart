import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Currency = 'KES' | 'UGX' | 'TZS';

interface CurrencyState {
  currency: Currency;
  exchangeRates: Record<Currency, number>; // Base is KES
  setCurrency: (currency: Currency) => void;
  setExchangeRates: (rates: Record<Currency, number>) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'KES', // Default
      exchangeRates: {
        KES: 1,
        UGX: 28, // Default fallback
        TZS: 20, // Default fallback
      },
      setCurrency: (currency) => set({ currency }),
      setExchangeRates: (rates) => set((state) => ({ ...state, exchangeRates: rates })),
    }),
    {
      name: 'currency-storage',
    }
  )
);
