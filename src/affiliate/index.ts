import { buildAwinLink } from './awin';
import type { AffiliateStore } from './stores';

export { AFFILIATE_STORES, getEnabledStoreById, getEnabledStores } from './stores';
export type { AffiliateStore, StoreId } from './stores';

export interface BuyLinkInput {
  isbn13: string | null;
  title: string;
  authors: string[];
}

export function buildBuyLink(book: BuyLinkInput, store: AffiliateStore): string | null {
  if (!store.awinmid) return null;

  const destinationUrl = book.isbn13 && store.bookUrl
    ? store.bookUrl(book.isbn13)
    : store.searchUrl?.([book.title, ...book.authors].join(' ').trim());

  if (!destinationUrl) return null;

  return buildAwinLink(store.awinmid, destinationUrl);
}
