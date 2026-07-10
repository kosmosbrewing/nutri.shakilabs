import type { NutrientProfile } from "./nutrients";

export const aliveProfiles: Record<string, NutrientProfile> = {
  "alive-men-60": {
    "vitamin-a": 555, "vitamin-d": 10, "vitamin-e": 25, "vitamin-k": 70,
    "vitamin-b1": 35, "vitamin-b2": 30, niacin: 45, "pantothenic-acid": 65,
    "vitamin-b6": 45, biotin: 100, folate: 300, "vitamin-b12": 150,
    "vitamin-c": 200, calcium: 100, magnesium: 50, zinc: 20, copper: 2,
    selenium: 135, iodine: 150, manganese: 3.5, chromium: 100, molybdenum: 75,
  },
  "alive-women-80": {
    "vitamin-a": 555, "vitamin-d": 10, "vitamin-e": 25, "vitamin-k": 70,
    "vitamin-b1": 30, "vitamin-b2": 25, niacin: 40, "pantothenic-acid": 60,
    "vitamin-b6": 40, biotin: 200, folate: 510, "vitamin-b12": 150,
    "vitamin-c": 200, calcium: 210, magnesium: 100, zinc: 15, copper: 2,
    selenium: 75, iodine: 150, manganese: 3.5, chromium: 100, molybdenum: 75,
  },
  "alive-50-plus-60": {
    "vitamin-a": 560, "vitamin-d": 50, "vitamin-e": 110, "vitamin-k": 70,
    "vitamin-b1": 12, "vitamin-b2": 14, niacin: 30, "pantothenic-acid": 50,
    "vitamin-b6": 22.5, biotin: 100, folate: 400, "vitamin-b12": 72,
    "vitamin-c": 200, zinc: 20, selenium: 200,
  },
  "alive-milk-thistle-60": {
    "vitamin-e": 11, "vitamin-b1": 1.2, "vitamin-b2": 14, niacin: 15,
    "pantothenic-acid": 5, "vitamin-b6": 1.5, biotin: 30, "vitamin-c": 100,
  },
};
