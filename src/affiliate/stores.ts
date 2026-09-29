export type StoreId = 'bookshop_uk' | 'casa_del_libro_es' | 'fnac_es' | 'waterstones_uk';

export interface AffiliateStore {
  id: StoreId;
  name: string;
  region: 'UK' | 'ES';
  /** null until the Awin advertiser program has approved this store. */
  awinmid: string | null;
  enabled: boolean;
  // Undefined until the retailer's destination URL format is confirmed.
  bookUrl?: (isbn13: string) => string;
  searchUrl?: (query: string) => string;
}

export const AFFILIATE_STORES: AffiliateStore[] = [
  {
    id: 'bookshop_uk',
    name: 'Bookshop.org UK',
    region: 'UK',
    awinmid: '62675',
    enabled: true,
    bookUrl: (isbn13) => `https://uk.bookshop.org/book/${isbn13}`,
    searchUrl: (query) => `https://uk.bookshop.org/search?keywords=${encodeURIComponent(query)}`,
  },
  { id: 'casa_del_libro_es', name: 'Casa del Libro', region: 'ES', awinmid: null, enabled: false },
  { id: 'fnac_es', name: 'Fnac', region: 'ES', awinmid: null, enabled: false },
  { id: 'waterstones_uk', name: 'Waterstones', region: 'UK', awinmid: null, enabled: false },
];

export function getEnabledStores(): AffiliateStore[] {
  return AFFILIATE_STORES.filter((store) => store.enabled && store.awinmid && store.bookUrl);
}

export function getEnabledStoreById(id: StoreId): AffiliateStore | undefined {
  return getEnabledStores().find((store) => store.id === id);
}
