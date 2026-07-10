import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { clientRoot, collectFontCharacters, fontJobs } from "./font-subset-config.mjs";

const characters = collectFontCharacters();
const temporaryRoot = mkdtempSync(join(tmpdir(), "nutri-fonts-"));
const characterFile = resolve(temporaryRoot, "characters.txt");
const manifestPath = resolve(clientRoot, "scripts/font-subset-manifest.json");

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

try {
  writeFileSync(characterFile, characters);

  for (const font of fontJobs) {
    const result = spawnSync("python3", [
      "-m",
      "fontTools.subset",
      font.source,
      `--text-file=${characterFile}`,
      `--output-file=${font.output}`,
      "--flavor=woff2",
      "--layout-features=*",
      "--name-IDs=*",
      "--name-legacy",
      "--name-languages=*",
      "--notdef-glyph",
      "--notdef-outline",
      "--recommended-glyphs",
      "--no-recalc-timestamp",
      "--drop-tables+=FFTM",
    ], { encoding: "utf8" });

    if (result.error || result.status !== 0) {
      const detail = result.error?.message ?? result.stderr.trim();
      throw new Error(`Font subsetting failed for ${font.publicName}: ${detail}`);
    }
  }

  const manifest = {
    schemaVersion: 1,
    characterCount: [...characters].length,
    characterSha256: hash(characters),
    fonts: fontJobs.map((font) => {
      const content = readFileSync(font.output);
      return {
        publicName: font.publicName,
        bytes: content.byteLength,
        sha256: hash(content),
      };
    }),
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${manifest.fonts.length} fonts for ${manifest.characterCount} characters.`);
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
