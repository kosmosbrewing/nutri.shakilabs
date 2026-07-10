import type { NutrientProfile } from "./nutrients";

export const otherProfiles: Record<string, NutrientProfile> = {
  "berocca-30": {
    "vitamin-b1": 15, "vitamin-b2": 15, niacin: 49.5, "pantothenic-acid": 23,
    "vitamin-b6": 8.2, biotin: 150, folate: 400, "vitamin-b12": 10,
    "vitamin-c": 500, calcium: 100, magnesium: 100, zinc: 10,
  },
  "acebiome-multivitamin-60": {
    "vitamin-a": 1190, "vitamin-d": 10, "vitamin-e": 11, "vitamin-k": 70,
    "vitamin-b1": 3.72, "vitamin-b2": 4.62, niacin: 22.5, "pantothenic-acid": 13.75,
    "vitamin-b6": 4.95, biotin: 54, folate: 520, "vitamin-b12": 25.2,
    "vitamin-c": 100, calcium: 210, magnesium: 94.5, iron: 6, zinc: 11.05,
    copper: 0.52, selenium: 55, iodine: 180, manganese: 3, chromium: 36, molybdenum: 50,
  },
};
