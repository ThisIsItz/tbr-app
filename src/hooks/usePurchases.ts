import { useContext } from 'react';

import { PurchasesContext } from '@/lib/purchases/PurchasesProvider';

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (!context) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }
  return context;
}
