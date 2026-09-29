const AWIN_AFFILIATE_ID = '3081317';
const AWIN_BASE_URL = 'https://www.awin1.com/cread.php';

export function buildAwinLink(awinmid: string, destinationUrl: string, clickref?: string): string {
  const params = new URLSearchParams({
    awinmid,
    awinaffid: AWIN_AFFILIATE_ID,
    ued: destinationUrl,
  });
  if (clickref) params.set('clickref', clickref);
  return `${AWIN_BASE_URL}?${params.toString()}`;
}
