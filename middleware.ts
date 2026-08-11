import { next, rewrite } from '@vercel/functions';

const MOBILE_OR_TABLET_USER_AGENT = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk|Kindle/i;
const SEARCH_CRAWLER_USER_AGENT = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|linkedinbot|whatsapp/i;

export const config = {
  // Run on customer-facing documents, including direct .html URLs, but never
  // invoke middleware for APIs or static assets required by the mobile site.
  matcher: [
    '/((?!api(?:/|$)|desktop-coming-soon(?:\\.html)?$|.*\\.(?:css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|map|json|xml|txt|pdf)$).*)',
  ],
};

export default function desktopComingSoonGate(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const isCustomiserPreview = /\/customization-tool(?:\/|$)/i.test(url.pathname)
    && url.searchParams.get('desktop-preview') === '1';

  // Mobile/tablet visitors keep the complete live experience. Search and
  // social crawlers also continue so a temporary desktop launch screen does
  // not remove the existing site from search results or link previews.
  if (
    MOBILE_OR_TABLET_USER_AGENT.test(userAgent)
    || SEARCH_CRAWLER_USER_AGENT.test(userAgent)
    || isCustomiserPreview
  ) {
    return next();
  }

  return rewrite(new URL('/desktop-coming-soon', request.url));
}
