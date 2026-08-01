// Cross-checks three sources: the vendored tgz, vendor/README.md, and the file: reference in
// package.json. The SHA-256 in that README is a supply-chain record someone verifies integrity
// against, so a stale value is not "outdated docs" -- it hands them a wrong answer.
//
// No-op when the app vendors nothing, so this file can be copied verbatim into all 12 apps.
// Comments are intentionally ASCII-only: client/scripts is a font-subset content root in the
// finance/card/house apps, so non-ASCII text here would grow the shipped font subsets.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vendorDir = resolve(projectRoot, "vendor");
const readmePath = resolve(vendorDir, "README.md");

if (!existsSync(vendorDir) || !existsSync(readmePath)) {
  console.log("verify-vendor-readme: no vendored artifacts, skipping.");
  process.exit(0);
}

const tarballs = readdirSync(vendorDir).filter((name) => name.endsWith(".tgz"));

if (tarballs.length === 0) {
  console.log("verify-vendor-readme: no vendored tarball, skipping.");
  process.exit(0);
}

const readme = readFileSync(readmePath, "utf8");
const pkg = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
const errors = [];

for (const tarball of tarballs) {
  const digest = createHash("sha256").update(readFileSync(resolve(vendorDir, tarball))).digest("hex");

  // The README must contain the filename and hash verbatim. This is what catches the common
  // drift of bumping the version string while leaving the old SHA-256 in place.
  if (!readme.includes(tarball)) {
    errors.push(`${tarball}: filename is not mentioned in vendor/README.md`);
  }

  if (!readme.includes(digest)) {
    errors.push(`${tarball}: SHA-256 ${digest} is not recorded in vendor/README.md`);
  }

  const referenced = Object.values(dependencies).some((range) => range === `file:vendor/${tarball}`);

  if (!referenced) {
    errors.push(`${tarball}: no dependency in package.json references file:vendor/${tarball}`);
  }
}

// Also catch a stale previous-version filename left behind in the README.
for (const stale of readme.match(/[\w.-]+\.tgz/g) ?? []) {
  if (!tarballs.includes(stale)) {
    errors.push(`vendor/README.md refers to ${stale}, which is not present in vendor/`);
  }
}

if (errors.length > 0) {
  console.error("verify-vendor-readme: vendor/README.md does not match the committed artifacts.");
  for (const error of [...new Set(errors)]) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`verify-vendor-readme: OK (${tarballs.join(", ")}).`);
