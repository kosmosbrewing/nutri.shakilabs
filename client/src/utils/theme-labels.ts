// 스크린리더 전용 aria-label. 예전에는 브랜드 폰트 스캐너가 .vue 전체를 훑어서
// 화면에 안 보이는 이 문구까지 서브셋에 넣었고, 그걸 피하려고 .ts로 뺐다.
// 지금은 수집이 렌더 실측이라(scripts/collect-brand-charset.mjs) 그 이유는 사라졌다 —
// 라벨을 한곳에 모아 두는 값만 남아서 파일을 유지한다.
export const THEME_TOGGLE_LABEL_TO_DARK = "다크 모드로 전환";
export const THEME_TOGGLE_LABEL_TO_LIGHT = "라이트 모드로 전환";
