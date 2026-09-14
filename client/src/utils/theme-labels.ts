// GmarketSansBold(브랜드 폰트) 서브셋 스캐너는 .vue 파일의 모든 텍스트를 훑는다(font-brand
// 클래스로 스코프되지 않음). 이 라벨은 스크린리더 전용 aria-label이라 브랜드 폰트로 렌더될 일이
// 없는데도 .vue 안에 두면 예산을 갉아먹는다 — .ts로 빼서 스캔 대상에서 제외한다.
export const THEME_TOGGLE_LABEL_TO_DARK = "다크 모드로 전환";
export const THEME_TOGGLE_LABEL_TO_LIGHT = "라이트 모드로 전환";
