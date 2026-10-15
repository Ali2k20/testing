import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * Locale without URL prefixes: an explicit override (e.g. the embeddable
 * widget's ?lang=), then the NEXT_LOCALE cookie, then Accept-Language.
 */
export default getRequestConfig(async ({ locale: override }) => {
  const locale = isLocale(override) ? override : await detectLocale();
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Asia/Dubai",
    // A request-scoped reference time keeps relative dates identical between
    // the server render and hydration.
    now: new Date(),
  };
});

async function detectLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  const preferred = accept.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return isLocale(preferred) ? preferred : defaultLocale;
}
