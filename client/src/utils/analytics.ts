import { z } from "zod";

export const ANALYTICS_CONSENT_KEY = "nutri-analytics-consent";
export const consentDecisionSchema = z.enum(["accepted", "rejected"]);
const measurementIdSchema = z.string().regex(/^G-[A-Z0-9]+$/);
const pageUrlSchema = z.string().url().max(2_048);

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
  z.object({
    name: z.enum(["related_tool_impression", "related_tool_click"]),
    from_tool: z.string().regex(/^[a-z0-9-]+$/).max(80),
    to_tool: z.string().regex(/^[a-z0-9-]+$/).max(80),
    placement: z.literal("similar_products"),
  }).strict(),
]);

export type AnalyticsEvent = z.infer<typeof eventSchema>;
type AnalyticsWindow = Window & { dataLayer?: unknown[] };
let activeMeasurementId: string | null = null;

export function sanitizePageUrl(input: unknown) {
  const parsed = pageUrlSchema.safeParse(input);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  url.search = "";
  url.hash = "";
  return { page_location: url.href, page_path: url.pathname };
}

export function buildAnalyticsEventCommand(input: unknown, pageUrl: unknown) {
  const parsed = eventSchema.safeParse(input);
  const page = sanitizePageUrl(pageUrl);
  if (!parsed.success || !page) return null;
  const { name, ...parameters } = parsed.data;
  return ["event", name, { ...parameters, ...page }];
}

function setAnalyticsDisabled(
  analyticsWindow: AnalyticsWindow,
  measurementId: string,
  disabled: boolean,
): void {
  const flags = analyticsWindow as unknown as Record<string, unknown>;
  flags[`ga-disable-${measurementId}`] = disabled;
}

function pushCommand(analyticsWindow: AnalyticsWindow, command: unknown[]): void {
  analyticsWindow.dataLayer ??= [];
  function queueCommand(..._values: unknown[]): void {
    analyticsWindow.dataLayer!.push(arguments);
  }
  queueCommand(...command);
}

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
  const measurementId = measurementIdSchema.safeParse(input);
  if (!measurementId.success || typeof window === "undefined") return false;
  if (readAnalyticsConsent() !== "accepted") return false;

  const analyticsWindow = window as AnalyticsWindow;
  activeMeasurementId = measurementId.data;
  setAnalyticsDisabled(analyticsWindow, measurementId.data, false);
  if (document.querySelector("script[data-nutri-ga]")) return true;
  const page = sanitizePageUrl(window.location.href);
  if (!page) return false;
  pushCommand(analyticsWindow, ["js", new Date()]);
  pushCommand(analyticsWindow, [
    "config",
    measurementId.data,
    {
      anonymize_ip: true,
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...page,
    },
  ]);
  const script = document.createElement("script");
  script.async = true;
  script.dataset.nutriGa = measurementId.data;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId.data)}`;
  document.head.append(script);
  return true;
}

export function disableAnalytics(input: unknown): boolean {
  if (typeof window === "undefined") return false;
  const parsed = measurementIdSchema.safeParse(input);
  const measurementId = parsed.success ? parsed.data : activeMeasurementId;
  if (!measurementId) return false;
  const analyticsWindow = window as AnalyticsWindow;
  setAnalyticsDisabled(analyticsWindow, measurementId, true);
  analyticsWindow.dataLayer?.splice(0);
  activeMeasurementId = null;
  return true;
}

export function trackAnalytics(input: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (readAnalyticsConsent() !== "accepted") return false;
  const analyticsWindow = window as AnalyticsWindow;
  if (!analyticsWindow.dataLayer || !document.querySelector("script[data-nutri-ga]")) return false;
  const command = buildAnalyticsEventCommand(input, window.location.href);
  if (!command) return false;
  pushCommand(analyticsWindow, command);
  return true;
}
