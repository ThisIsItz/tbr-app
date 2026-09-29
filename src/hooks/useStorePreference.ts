import { useEffect, useState } from 'react';

import { AFFILIATE_STORES, getEnabledStoreById, getEnabledStores, type StoreId } from '@/affiliate';
import { getSetting, setSetting } from '@/api/repository/settingsRepository';

const SETTING_KEY = 'preferredStoreId';

function isStoreId(value: string | null): value is StoreId {
  return AFFILIATE_STORES.some((store) => store.id === value);
}

export function useStorePreference() {
  const [preferredStoreId, setPreferredStoreIdState] = useState<StoreId | null>(null);

  useEffect(() => {
    getSetting(SETTING_KEY).then((value) => setPreferredStoreIdState(isStoreId(value) ? value : null));
  }, []);

  function setPreferredStoreId(id: StoreId) {
    setPreferredStoreIdState(id);
    setSetting(SETTING_KEY, id);
  }

  const preferredStore =
    (preferredStoreId && getEnabledStoreById(preferredStoreId)) ?? getEnabledStores()[0];

  return { preferredStoreId, preferredStore, setPreferredStoreId };
}
