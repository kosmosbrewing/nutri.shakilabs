// Checks only that the committed SBOM describes THIS repository.
//
// Why identity fields instead of "regenerate and git diff --exit-code": regeneration is not
// reproducible. CycloneDX metadata.timestamp, SPDX documentNamespace (UUID) and created, the npm
// CLI version baked into metadata.tools, and the absolute local path in the vendored tarball's
// downloadLocation all change per run/machine. A diff gate would be permanently red.
//
// No-op when the app does not commit an SBOM, so this file can be copied verbatim into all 12 apps.
// Comments are intentionally ASCII-only: client/scripts is a font-subset content root in the
// finance/card/house apps, so non-ASCII text here would grow the shipped font subsets.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sbomDir = resolve(projectRoot, "artifacts", "sbom");
const cyclonedxPath = resolve(sbomDir, "production.cyclonedx.json");

if (!existsSync(cyclonedxPath)) {
  console.log("verify-sbom-identity: no committed SBOM, skipping.");
  process.exit(0);
}

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const pkg = readJson(resolve(projectRoot, "package.json"));
const errors = [];

const check = (label, actual, expected) => {
  if (actual !== expected) {
    errors.push(`${label}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
  }
};

const cyclonedx = readJson(cyclonedxPath);
const component = cyclonedx.metadata?.component ?? {};

check("cyclonedx metadata.component.name", component.name, pkg.name);
check("cyclonedx metadata.component.version", component.version, pkg.version);

// GITHUB_REPOSITORY exists only on CI; skip the vcs check locally so local runs still work.
if (process.env.GITHUB_REPOSITORY) {
  const vcs = (component.externalReferences ?? []).find((reference) => reference.type === "vcs");
  check("cyclonedx vcs url", vcs?.url, `https://github.com/${process.env.GITHUB_REPOSITORY}`);
}

const spdxPath = resolve(sbomDir, "production.spdx.json");

if (existsSync(spdxPath)) {
  const spdx = readJson(spdxPath);
  const rootId = spdx.documentDescribes?.[0];
  const rootPackage = spdx.packages?.find((entry) => entry.SPDXID === rootId);

  check("spdx root package name", rootPackage?.name, pkg.name);
  check("spdx root package versionInfo", rootPackage?.versionInfo, pkg.version);
}

if (errors.length > 0) {
  console.error("verify-sbom-identity: committed SBOM does not describe this repository.");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error("Run `npm run sbom:prod` in this repository to regenerate it.");
  process.exit(1);
}

console.log(`verify-sbom-identity: OK (${pkg.name}@${pkg.version}).`);
