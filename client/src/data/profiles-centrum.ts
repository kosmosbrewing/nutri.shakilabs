import type { NutrientProfile } from "./nutrients";

export const centrumProfiles: Record<string, NutrientProfile> = {
  "centrum-men-50": {
    "vitamin-a": 1159, "vitamin-d": 10, "vitamin-e": 36.9, "vitamin-k": 50,
    "vitamin-b1": 3.7, "vitamin-b2": 4.6, niacin: 16, "pantothenic-acid": 13.6,
    "vitamin-b6": 4.9, biotin: 54, folate: 200, "vitamin-b12": 25,
    "vitamin-c": 150, calcium: 210, magnesium: 84, iron: 5, zinc: 11,
    copper: 0.5, selenium: 55, iodine: 150, manganese: 3, chromium: 35, molybdenum: 50,
  },
  "centrum-women-112": {
    "vitamin-a": 1097, "vitamin-d": 10, "vitamin-e": 33.5, "vitamin-k": 50,
    "vitamin-b1": 3.4, "vitamin-b2": 3.9, niacin: 16, "pantothenic-acid": 13.6,
    "vitamin-b6": 4.9, biotin: 45, folate: 400, "vitamin-b12": 22,
    "vitamin-c": 120, calcium: 250, magnesium: 64, iron: 10, zinc: 8,
    copper: 0.5, selenium: 55, iodine: 150, manganese: 3, chromium: 35, molybdenum: 50,
  },
  "centrum-silver-men-112": {
    "vitamin-a": 1159, "vitamin-d": 12.5, "vitamin-e": 40.2, "vitamin-k": 50,
    "vitamin-b1": 3.7, "vitamin-b2": 4.6, niacin: 16, "pantothenic-acid": 13.6,
    "vitamin-b6": 9.8, biotin: 54, folate: 300, "vitamin-b12": 45,
    "vitamin-c": 150, calcium: 230, magnesium: 84, iron: 4, zinc: 11,
    copper: 0.5, selenium: 55, iodine: 150, manganese: 3, chromium: 35, molybdenum: 50,
  },
  "centrum-silver-women-50": {
    "vitamin-a": 1097, "vitamin-d": 12.5, "vitamin-e": 36.9, "vitamin-k": 50,
    "vitamin-b1": 3.4, "vitamin-b2": 3.9, niacin: 14, "pantothenic-acid": 12,
    "vitamin-b6": 9.8, biotin: 45, folate: 300, "vitamin-b12": 35,
    "vitamin-c": 120, calcium: 280, magnesium: 64, iron: 6, zinc: 8,
    copper: 0.5, selenium: 55, iodine: 150, manganese: 3, chromium: 35, molybdenum: 50,
  },
};
