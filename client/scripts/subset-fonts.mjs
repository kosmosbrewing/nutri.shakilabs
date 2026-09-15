import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  clientRoot,
  collectFontCharacters,
  fontJobs,
} from "./font-subset-config.mjs";

const characters = collectFontCharacters();
const temporaryRoot = mkdtempSync(join(tmpdir(), "nutri-fonts-"));
const manifestPath = resolve(clientRoot, "scripts/font-subset-manifest.json");

// 산출물에 실제로 들어간 글리프를 fontTools로 읽는다. 여기서만 파이썬을 부른다 —
// 이 스크립트는 사람이 직접 돌리는 생성기라 fontTools가 있고, 빌드 게이트가 도는
// Vercel·CI에는 없다. 그래서 "무엇이 담겼나"를 여기서 확정해 매니페스트에 적고,
// 게이트는 그 기록과 sha256으로 판정한다.
// document.fonts.check()는 쓰지 않는다 — 이 환경 Chromium은 무엇을 물어도 true다.
function readShippedCharacters(fontPath) {
  const result = spawnSync("python3", [
    "-c",
    "import sys, json\nfrom fontTools.ttLib import TTFont\nprint(json.dumps(sorted(TTFont(sys.argv[1]).getBestCmap())))",
    fontPath,
  ], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(`Cannot read cmap of ${fontPath}: ${result.error?.message ?? result.stderr.trim()}`);
  }
  return new Set(JSON.parse(result.stdout).map((code) => String.fromCodePoint(code)));
}

// 요청한 문자 중 산출물에 없는 것 = 원본 폰트에 글리프가 없는 문자다(이모지 등).
// 글리프 단위 폴백이 정상 동작이라 실패시키지 않되, 조용히 넘기지 않고 기록한다.
function describeSubsetCoverage(fontJob) {
  const shipped = readShippedCharacters(fontJob.output);
  const requested = [...fontJob.characters];
  const dropped = requested.filter((character) => !shipped.has(character));
  const sourceCharacters = readShippedCharacters(fontJob.source);
  const unexpected = dropped.filter((character) => sourceCharacters.has(character));
  if (unexpected.length > 0) {
    throw new Error(`${fontJob.publicName} dropped ${unexpected.length} glyphs the source font has: ${unexpected.join("")}`);
  }
  if (dropped.length > 0) {
    console.warn(`${fontJob.publicName}: ${dropped.join("")} absent from the source font (per-glyph fallback).`);
  }
  return {
    shippedCharacters: requested.filter((character) => shipped.has(character)).join(""),
    droppedCharacters: dropped.join(""),
  };
}

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

try {
  for (const font of fontJobs) {
    // 브랜드 폰트는 자기 문자셋(렌더 실측)과 자기 플래그를 쓴다 — UI 전체 문자셋으로
    // 자르면 화면에 없는 한글 수백 자를 같이 배송한다.
    const fontCharacters = font.characters ?? characters;
    const characterFile = resolve(temporaryRoot, `${font.publicName}.txt`);
    writeFileSync(characterFile, fontCharacters);
    const result = spawnSync("python3", [
      "-m",
      "fontTools.subset",
      font.source,
      `--text-file=${characterFile}`,
      `--output-file=${font.output}`,
      "--flavor=woff2",
      ...(font.subsetArguments ?? [
        "--layout-features=*",
        "--name-IDs=*",
        "--name-legacy",
        "--name-languages=*",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--no-recalc-timestamp",
        "--drop-tables+=FFTM",
      ]),
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
        characterCount: [...(font.characters ?? characters)].length,
        sha256: hash(content),
        // 자기 문자셋을 선언한 잡(브랜드 폰트)만 "실제로 담긴 글자"를 기록한다.
        // 빌드 게이트는 fontTools 없이 이 기록으로 커버리지를 판정한다.
        ...(font.characters ? describeSubsetCoverage(font) : {}),
      };
    }),
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${manifest.fonts.length} fonts for ${manifest.characterCount} characters.`);
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
