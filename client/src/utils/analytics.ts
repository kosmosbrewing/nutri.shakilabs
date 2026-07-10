import { z } from "zod";

export const ANALYTICS_CONSENT_KEY = "nutri-analytics-consent";
export const consentDecisionSchema = z.enum(["accepted", "rejected"]);

const eventSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("page_view"),
    route: z.string().startsWith("/").max(160),
  }).strict(),
  z.object({
    name: z.literal("ranking_view"),
    category: z.literal("multivitamin"),
    score_version: z.literal("value-v1"),
  }).strict(),
  z.object({
    name: z.literal("filter_apply"),
    filter_name: z.enum(["query", "brand", "budget", "confidence", "sort"]),
  }).strict(),
  z.object({
    name: z.literal("compare_view"),
    product_count: z.number().int().min(2).max(4),
  }).strict(),
  z.object({
    name: z.literal("source_open"),
    source_type: z.enum(["public_api", "manufacturer_label", "official_store", "retailer"]),
  }).strict(),
  z.object({
    name: z.literal("affiliate_click"),
    product_id: z.string().regex(/^[a-z0-9-]+$/).max(80),
    seller: z.string().min(1).max(80),
    affiliate: z.boolean(),
  }).strict(),
]);

export type AnalyticsEvent = z.infer<typeof eventSchema>;
type AnalyticsWindow = Window & { dataLayer?: unknown[] };

export function parseAnalyticsEvent(input: unknown) {
  return eventSchema.safeParse(input);
}

export function readAnalyticsConsent(): z.infer<typeof consentDecisionSchema> | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = consentDecisionSchema.safeParse(localStorage.getItem(ANALYTICS_CONSENT_KEY));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(input: unknown): boolean {
  const parsed = consentDecisionSchema.safeParse(input);
  if (!parsed.success || typeof window === "undefined") return false;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, parsed.data);
    return true;
  } catch {
    return false;
  }
}

export function initializeAnalytics(input: unknown): boolean {
  const measurementId = z.string().regex(/^G-[A-Z0-9]+$/).safeParse(input);
  if (!measurementId.success || typeof window === "undefined") return false;
  if (readAnalyticsConsent() !== "accepted") return false;
  if (document.querySelector("script[data-nutri-ga]")) return true;

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.dataLayer.push(["js", new Date()]);
  analyticsWindow.dataLayer.push([
    "config",
    measurementId.data,
    { anonymize_ip: true, send_page_view: false },
  ]);
  const script = document.createElement("script");
  script.async = true;
  script.dataset.nutriGa = "true";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId.data)}`;
  document.head.append(script);
  return true;
}

export function trackAnalytics(input: unknown): boolean {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success || typeof window === "undefined") return false;
  if (readAnalyticsConsent() !== "accepted") return false;
  const analyticsWindow = window as AnalyticsWindow;
  if (!analyticsWindow.dataLayer || !document.querySelector("script[data-nutri-ga]")) return false;
  const { name, ...parameters } = parsed.data;
  analyticsWindow.dataLayer.push({ event: name, ...parameters });
  return true;
}
