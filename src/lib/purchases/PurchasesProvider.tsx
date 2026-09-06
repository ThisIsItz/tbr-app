import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
} from 'react-native-purchases';

// Single non-consumable entitlement (granted by the "lifetime" product) unlocking the
// randomizer, accent colors, and cover scanning. Extend this (and the offering lookup
// below) when tier 2 is added.
export const PRO_ENTITLEMENT_ID = 'tbr_pro';

export type PurchaseErrorKind = 'purchase' | 'restore' | null;
export type RestoreResult = 'restored' | 'empty' | 'error';

export interface PurchasesContextValue {
  isLoading: boolean;
  isPro: boolean;
  offering: PurchasesOffering | null;
  error: PurchaseErrorKind;
  justPurchased: boolean;
  dismissJustPurchased: () => void;
  purchase: () => Promise<void>;
  restore: () => Promise<RestoreResult>;
}

export const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function getApiKey(): string | undefined {
  const key = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    // The app isn't sold through web, but web is still a real Expo target (and how this
    // gets tested here) — reuse the iOS slot so a test_/rcb_ key works there too.
    web: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    default: undefined,
  });
  return key || undefined;
}

function hasProEntitlement(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const apiKey = useMemo(getApiKey, []);
  const [isLoading, setIsLoading] = useState(!!apiKey);
  // No RevenueCat key configured yet: unlock everything in dev builds so local testing
  // isn't blocked, but stay locked in a real build (fail closed, not open).
  const [isPro, setIsPro] = useState(!apiKey && __DEV__);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [error, setError] = useState<PurchaseErrorKind>(null);
  const [justPurchased, setJustPurchased] = useState(false);

  const dismissJustPurchased = useCallback(() => setJustPurchased(false), []);

  useEffect(() => {
    if (!apiKey) return;

    Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    Purchases.addCustomerInfoUpdateListener((customerInfo) => setIsPro(hasProEntitlement(customerInfo)));

    (async () => {
      try {
        const [customerInfo, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        setIsPro(hasProEntitlement(customerInfo));
        setOffering(offerings.current);
      } catch (err) {
        console.warn('[Purchases] failed to load customer info/offerings:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [apiKey]);

  const purchase = useCallback(async () => {
    const pkg = offering?.availablePackages[0];
    if (!pkg) return;

    setError(null);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const nowPro = hasProEntitlement(customerInfo);
      setIsPro(nowPro);
      if (nowPro) setJustPurchased(true);
    } catch (err) {
      if (!(err as { userCancelled?: boolean })?.userCancelled) {
        console.warn('[Purchases] purchase failed:', err);
        setError('purchase');
      }
    }
  }, [offering]);

  const restore = useCallback(async (): Promise<RestoreResult> => {
    setError(null);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const nowPro = hasProEntitlement(customerInfo);
      setIsPro(nowPro);
      return nowPro ? 'restored' : 'empty';
    } catch (err) {
      console.warn('[Purchases] restore failed:', err);
      setError('restore');
      return 'error';
    }
  }, []);

  const value = useMemo<PurchasesContextValue>(
    () => ({ isLoading, isPro, offering, error, justPurchased, dismissJustPurchased, purchase, restore }),
    [isLoading, isPro, offering, error, justPurchased, dismissJustPurchased, purchase, restore],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}
