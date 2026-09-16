import { describe, expect, it } from "vitest";
// @ts-expect-error — 폰트 게이트 스크립트는 .mjs다(다른 테스트도 같은 방식으로 붙는다)
import { stripSourceComments } from "../../scripts/font-subset-config.mjs";

const strip = stripSourceComments as (source: string, extension: string) => string;

// 한글만 뽑아 비교한다 — 폰트 문자셋에서 중요한 건 한글 집합뿐이다
function hangul(text: string): string {
  return [...new Set([...text].filter((c) => /[가-힣ᄀ-ᇿ]/.test(c)))].sort().join("");
}

describe("stripSourceComments", () => {
  it("drops Korean that lives only in a JS line comment", () => {
    const source = 'const label = "영양제";\n// 주석에만 있는 글자: 뻐꾹\n';
    expect(hangul(strip(source, ".ts"))).toBe(hangul('"영양제"'));
  });

  it("keeps Korean after a protocol slash in a template text node", () => {
    // 과소 수집 회귀 방지: `//`를 무조건 자르면 이 줄의 "가격효율"이 통째로 사라진다
    const source = "<template>\n  <p>출처 https://example.com 가격효율 비교</p>\n</template>";
    expect(strip(source, ".vue")).toContain("가격효율 비교");
  });

  it("keeps Korean inside a string that contains a protocol slash", () => {
    const source = 'const source = "https://example.com 공공데이터";\n';
    expect(strip(source, ".ts")).toContain("공공데이터");
  });

  it("keeps Korean after url() in CSS and drops CSS block comments", () => {
    const source = '/* 주석 한글 뻐꾹 */\n.a { background: url(//cdn.example.com/a.png); }\n.b::after { content: "원"; }';
    const stripped = strip(source, ".css");
    expect(stripped).toContain('"원"');
    expect(stripped).not.toContain("뻐꾹");
  });

  it("drops HTML comments but keeps template text", () => {
    const source = "<!-- 숨은 주석 뻐꾹 -->\n<p>표시되는 문구</p>";
    const stripped = strip(source, ".html");
    expect(stripped).toContain("표시되는 문구");
    expect(stripped).not.toContain("뻐꾹");
  });

  it("applies script syntax inside <script> and markup syntax outside it", () => {
    const source = [
      "<script setup lang=\"ts\">",
      "// 스크립트 주석 뻐꾹",
      'const unit = "1일 섭취량";',
      "</script>",
      "<template>",
      "  <!-- 템플릿 주석 까투리 -->",
      "  <span>{{ unit }} 기준</span>",
      "</template>",
    ].join("\n");
    const stripped = strip(source, ".vue");
    expect(stripped).toContain("1일 섭취량");
    expect(stripped).toContain("기준");
    expect(stripped).not.toContain("뻐꾹");
    expect(stripped).not.toContain("까투리");
  });

  it("leaves JSON untouched — 주석 문법이 없다", () => {
    const source = '{"note": "https://example.com 표시 문구"}';
    expect(strip(source, ".json")).toBe(source);
  });
});
