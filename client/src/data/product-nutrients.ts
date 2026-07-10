import type { ProductNutrient } from "./types";
import { nutrientReferences, type NutrientProfile } from "./nutrients";
import { centrumProfiles } from "./profiles-centrum";
import { aliveProfiles } from "./profiles-alive";
import { otherProfiles } from "./profiles-other";
import { products } from "./products";

const profiles: Record<string, NutrientProfile> = {
  ...centrumProfiles,
  ...aliveProfiles,
  ...otherProfiles,
};

export const productNutrients: ProductNutrient[] = products.flatMap((product) => {
  const profile = profiles[product.id];
  if (!profile) throw new Error(`Missing nutrient profile: ${product.id}`);
  return nutrientReferences.map((reference) => {
    const amount = profile[reference.id];
    const present = amount !== undefined;
    return {
      productId: product.id,
      nutrientId: reference.id,
      amountPerServing: amount ?? 0,
      canonicalUnit: reference.canonicalUnit,
      originalValue: present
        ? `${amount} ${reference.canonicalUnit}`
        : `0 ${reference.canonicalUnit} (full label not listed)`,
      presence: present ? "verified" : "absent",
      sourceId: product.labelSourceId,
    };
  });
});
