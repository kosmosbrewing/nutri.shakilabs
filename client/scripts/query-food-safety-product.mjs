import { z } from "zod";
import {
  createFoodSafetyPortalSession,
  fetchFoodSafetyProductDetail,
  searchFoodSafetyProducts,
} from "./food-safety-portal.mjs";

const queryResult = z.string().trim().min(2).max(120).safeParse(process.argv.slice(2).join(" "));
if (!queryResult.success) throw new Error("Provide a product name with at least two characters");

const session = await createFoodSafetyPortalSession();
const matches = await searchFoodSafetyProducts(session, queryResult.data);
const output = [];
for (const match of matches.slice(0, 20)) {
  const detail = await fetchFoodSafetyProductDetail(session, match.prdlst_report_ledg_no);
  output.push({
    ledgerNo: match.prdlst_report_ledg_no,
    manufacturer: detail.manufacturer,
    officialName: detail.officialName,
    reportNo: detail.reportNo,
    intakeText: detail.intakeText,
    standardText: detail.standardText,
  });
  await new Promise((resolve) => setTimeout(resolve, 250));
}
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
