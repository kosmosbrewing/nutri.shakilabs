import { z } from "zod";

export const RECENT_PRODUCTS_KEY = "nutri-recent-products";
export const RECENT_PRODUCTS_MAX = 5;

const storedIdsSchema = z.array(z.string().regex(/^[a-z0-9-]+$/).max(80)).max(20);

// localStorage raw 값 → 검증된 최근 제품 id 목록 (알 수 없는 id는 버린다)
export function parseRecentIds(raw: unknown, validIds: readonly string[]): string[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = storedIdsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    const validSet = new Set(validIds);
    return [...new Set(parsed.data)].filter((id) => validSet.has(id)).slice(0, RECENT_PRODUCTS_MAX);
  } catch {
    return [];
  }
}

export function pushRecentId(ids: readonly string[], id: string): string[] {
  return [id, ...ids.filter((existing) => existing !== id)].slice(0, RECENT_PRODUCTS_MAX);
}
